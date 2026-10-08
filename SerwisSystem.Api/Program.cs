using SerwisSystem.Api.Models.DTOs;
using Microsoft.AspNetCore.HttpOverrides;
using System.Net;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SerwisSystem.Api.Authorization;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Services;
using System.Text;
using System.Text.Json.Serialization;


var builder = WebApplication.CreateBuilder(args);

var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException("Configure Jwt:Key with at least 32 bytes of signing secret.");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactClient", policy =>
    {
        policy
            .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.IncludeErrorDetails = false;
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var sessionClaim = context.Principal?.FindFirst("session_version")?.Value;
                if (!Guid.TryParse(sessionClaim, out var sessionVersion)) { context.Fail("Invalid session."); return; }
                var users = context.HttpContext.RequestServices.GetRequiredService<UserService>();
                var user = await users.GetCurrentUser(context.Principal!, context.HttpContext.RequestAborted);
                if (user == null || user.SessionVersion != sessionVersion) context.Fail("Session expired.");
            }
        };
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "SerwisSystem.Api",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "SerwisSystem.Staff",
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            IssuerSigningKey = new SymmetricSecurityKey(
                   Encoding.UTF8.GetBytes(jwtKey)
            )
        };
    });


builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.SuppressMapClientErrors = true;
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(
                    x => x.Key,
                    x => x.Value!.Errors
                        .Select(e => e.Exception != null || string.IsNullOrWhiteSpace(e.ErrorMessage) ||
                            e.ErrorMessage.StartsWith("The ") || e.ErrorMessage.StartsWith("A non-empty")
                            ? "Nieprawidłowa wartość lub format danych." : e.ErrorMessage)
                        .ToArray()
                );

            return new BadRequestObjectResult(new ApiErrorResponse(400, "Sprawdź poprawność wprowadzonych danych.", errors));
        };
    })
   .AddJsonOptions(options =>
   {
       options.JsonSerializerOptions.Converters.Add(
           new JsonStringEnumConverter(allowIntegerValues: false)
       );

       options.JsonSerializerOptions.ReferenceHandler =
           ReferenceHandler.IgnoreCycles;
   });


var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Configure ConnectionStrings:DefaultConnection in secrets.");
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddAuthorization();

builder.Services.AddSingleton<
    IAuthorizationPolicyProvider,
    PermissionPolicyProvider>();

builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddScoped<EmailService>();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddOpenApi();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    var rules = new[]
    {
        (Name: "login", Limit: 10, Minutes: 1),
        (Name: "register", Limit: 5, Minutes: 60),
        (Name: "repair-check", Limit: 20, Minutes: 1),
        (Name: "repair-create", Limit: builder.Configuration.GetValue("RateLimits:RepairCreatePermitLimit", 15),
            Minutes: builder.Configuration.GetValue("RateLimits:RepairCreateWindowMinutes", 30))
    };
    foreach (var rule in rules)
        options.AddPolicy(rule.Name, context => RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = rule.Limit,
                Window = TimeSpan.FromMinutes(rule.Minutes),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.OnRejected = async (context, cancellationToken) =>
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            context.HttpContext.Response.Headers.RetryAfter = ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
        await context.HttpContext.Response.WriteAsJsonAsync(new ApiErrorResponse(429, "Zbyt wiele żądań. Spróbuj ponownie później."), cancellationToken);
    };
});


var trustedProxies = builder.Configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? [];
if (trustedProxies.Length > 0)
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownProxies.Clear();
        options.KnownIPNetworks.Clear();
        foreach (var address in trustedProxies) options.KnownProxies.Add(IPAddress.Parse(address));
    });
}
var app = builder.Build();
if (trustedProxies.Length > 0) app.UseForwardedHeaders();

app.UseExceptionHandler();
app.UseStatusCodePages(async context =>
{
    var response = context.HttpContext.Response;
    var message = response.StatusCode switch
    {
        401 => "Zaloguj się, aby kontynuować.",
        403 => "Nie masz uprawnień do wykonania tej czynności.",
        404 => "Nie znaleziono żądanych danych.",
        405 => "Ta metoda żądania nie jest obsługiwana.",
        _ => "Nie udało się wykonać żądania."
    };
    await response.WriteAsJsonAsync(new ApiErrorResponse(response.StatusCode, message));
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseRouting();
app.UseCors("ReactClient");

app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers();




await FirstAdminSetup.InitializeAsync(app.Services, app.Configuration);
app.Run();
