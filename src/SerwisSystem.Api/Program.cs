using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SerwisSystem.Api.Authorization;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using SerwisSystem.Api.Services;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;


var builder = WebApplication.CreateBuilder(args);

// Issuer and Audience come from appsettings.json. The Key is a secret: set it with
// `dotnet user-secrets set Jwt:Key <value>` in development or the Jwt__Key environment variable in production.
builder.Services.AddOptions<JwtOptions>()
    .BindConfiguration(JwtOptions.SectionName)
    .Validate(
        jwt => jwt.Key.Length >= JwtOptions.MinKeyLength,
        $"Jwt:Key is missing or shorter than {JwtOptions.MinKeyLength} characters. " +
        "Set it with 'dotnet user-secrets set Jwt:Key <value>' or the Jwt__Key environment variable.")
    .Validate(
        jwt => jwt.Issuer != "" && jwt.Audience != "",
        "Jwt:Issuer and Jwt:Audience must be set.")
    .ValidateOnStart(); // fail when the app starts, not at the first login

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactClient", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

// Configured through the options system so the validated JwtOptions are used.
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((options, jwtOptions) =>
    {
        var jwt = jwtOptions.Value;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key))
        };
    });


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());

        // Entities reference each other (User -> Repairs -> User); skip the cycles instead of failing.
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;

        // Keys of validation "errors" are serialized in camelCase, like the JSON fields they refer to.
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        // Automatic model validation returns the same ProblemDetails shape as every other error.
        options.InvalidModelStateResponseFactory = context =>
        {
            var problemDetailsFactory = context.HttpContext.RequestServices
                .GetRequiredService<ProblemDetailsFactory>();

            var problem = problemDetailsFactory.CreateValidationProblemDetails(
                context.HttpContext,
                context.ModelState,
                statusCode: StatusCodes.Status400BadRequest,
                title: "Validation failed.");

            return new BadRequestObjectResult(problem);
        };
    });


builder.Services.AddDbContext<AppDbContext>(options =>// options for database context
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthorization();

builder.Services.AddSingleton<
    IAuthorizationPolicyProvider,
    PermissionPolicyProvider>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<FirstAdminSeeder>();
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails(options =>
{
    // Responses produced by middleware (JWT challenge, authorization, rate limiter) have no message of
    // their own, so give them a readable "detail" that the frontend can show.
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Detail ??= context.ProblemDetails.Status switch
        {
            StatusCodes.Status401Unauthorized => "You must be logged in.",
            StatusCodes.Status403Forbidden => "You do not have permission to do this.",
            StatusCodes.Status429TooManyRequests => "Too many requests. Try again in a minute.",
            _ => null
        };
    };
});

// Anonymous endpoints (e.g. reporting a repair) are open to everyone, so limit how often
// one client IP can call them. Endpoints opt in with [EnableRateLimiting("public")].
builder.Services.AddRateLimiter(options =>
{
    // The empty 429 response gets a ProblemDetails body from UseStatusCodePages.
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("public", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1)
            }));
});

builder.Services.AddOpenApi();


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<FirstAdminSeeder>();
    await seeder.SeedAsync();
}

app.UseExceptionHandler();

// Turns empty error responses (401 from JWT, 403 from authorization, 404 for unknown routes)
// into ProblemDetails bodies.
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("ReactClient");

app.UseAuthentication();
app.UseAuthorization();

app.UseRateLimiter();

app.MapControllers();

app.MapGet("/", () =>
{
    return "hello world";
});


app.Run();
