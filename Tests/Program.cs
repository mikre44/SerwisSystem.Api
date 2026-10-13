using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Services;
using SerwisSystem.Api.Models.Enums;

if (args.Contains("--check-email"))
{
    var emailConfiguration = new ConfigurationBuilder().AddUserSecrets(typeof(AppDbContext).Assembly).AddEnvironmentVariables().Build();
    using var smtp = new MailKit.Net.Smtp.SmtpClient { Timeout = 15000 };
    using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(20));
    try
    {
        foreach (var key in new[] { "FromEmail", "RepairNotificationRecipient" })
            MimeKit.MailboxAddress.Parse(emailConfiguration[$"Email:{key}"] ?? "");
        Console.WriteLine("Email addresses are valid.");
        var port = int.Parse(emailConfiguration["Email:SmtpPort"]!);
        await smtp.ConnectAsync(emailConfiguration["Email:SmtpHost"]!, port,
            port == 465 ? MailKit.Security.SecureSocketOptions.SslOnConnect : MailKit.Security.SecureSocketOptions.StartTls, timeout.Token);
        Console.WriteLine("SMTP connection established.");
        await smtp.AuthenticateAsync(emailConfiguration["Email:Username"]!, emailConfiguration["Email:Password"]!, timeout.Token);
        Console.WriteLine("SMTP authentication succeeded. No email was sent.");
        await smtp.DisconnectAsync(true, timeout.Token);
    }
    catch (Exception exception)
    {
        Console.WriteLine($"Email diagnostic failed: {exception.GetType().Name}");
        var message = exception.Message;
        foreach (var setting in emailConfiguration.AsEnumerable().Where(setting => setting.Key.StartsWith("Email:") && !string.IsNullOrEmpty(setting.Value)))
            message = message.Replace(setting.Value!, "[hidden]", StringComparison.OrdinalIgnoreCase);
        Console.WriteLine(message);
        Environment.ExitCode = 1;
    }
    return;
}

var checks = 0;
void Check(bool condition, string description)
{
    if (!condition) throw new Exception(description);
    checks++;
    Console.WriteLine($"PASS {description}");
}
bool IsValid(object value) => Validator.TryValidateObject(value, new ValidationContext(value), [], true);
Check(IsValid(new RegisterDto { Username = "Anna Kowalska", Email = "anna@example.invalid", Password = "test-password" }), "Names with spaces are accepted");
Check(!IsValid(new RegisterDto { Username = "anna@example.invalid", Email = "anna@example.invalid", Password = "test-password" }), "Username cannot collide with email syntax");
Check(!IsValid(new UpdatePriorityDto { Priority = 1000 }), "Priority above 999 is rejected");
Check(IsValid(new UpdatePriorityDto { Priority = 999 }), "Priority 999 is accepted");
var codes = Enumerable.Range(0, 1000).Select(_ => RepairTracking.GenerateCode()).ToArray();
Check(codes.All(code => code.Length == 8 && code.All("ABCDEFGHJKLMNPQRSTUVWXYZ23456789".Contains)), "Tracking codes use eight unambiguous characters");
Check(RepairTracking.HashCode("abcdefgh") == RepairTracking.HashCode("ABCDEFGH"), "Tracking code comparison ignores case");
var monitor = "Monitor interaktywny myBoard Titan (Android 15)";
Check(!RepairValidation.Validate(monitor, false, "worker note", "5260250274", false, null, false).Any(), "Workers can enter any non-empty serial format");
Check(RepairValidation.Validate(monitor, false, "", "5260250274", false, null, false).Any(), "Required worker serial cannot be empty");
Check(RepairValidation.Validate(monitor, false, "worker note", "5260250274", false, null, true).Any(), "Customer serial rules remain enforced");

var emailBody = (MimeKit.Multipart)EmailService.CreateConfirmationBody("<b>Name</b>", "ABCDEFGH", "<a href='bad'>Product</a>", "<img src='bad'>");
var emailHtml = emailBody.OfType<MimeKit.TextPart>().Single(part => part.IsHtml).Text;
Check(!emailHtml.Contains("<a href") && emailHtml.Contains("&lt;a"), "Customer text cannot inject email HTML");

var configuration = new ConfigurationBuilder().AddUserSecrets(typeof(AppDbContext).Assembly).AddEnvironmentVariables().Build();
var pdfRepair = new Repair { Id = 123, Product = "Zażółć gęślą jaźń", CompanyCity = "Łódź", Description = string.Join(" ", Enumerable.Repeat("Długi opis usterki z polskimi znakami: ą ć ę ł ń ó ś ź ż.", 100)), RepairMethod = RepairMethod.TechnicianVisit };
var samplePdf = new RepairPdfService().CreatePdf(pdfRepair);
Check(System.Text.Encoding.ASCII.GetString(samplePdf, 0, 5) == "%PDF-", "Repair export generates a PDF with the embedded font");
if (Environment.GetEnvironmentVariable("SERWIS_SAMPLE_PDF") is { } samplePath)
    await File.WriteAllBytesAsync(samplePath, samplePdf);
var methodBody = EmailService.CreateRepairMethodBody(pdfRepair);
Check(methodBody.Contains("Łódź") && methodBody.Contains("Numer naprawy: 123") && methodBody.Contains("Naprawa z dojazdem"), "Internal notification includes city, repair number and reason");
var connectionString = configuration["SERWIS_TEST_CONNECTION"] ?? configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new Exception("Set SERWIS_TEST_CONNECTION to a PostgreSQL connection with permission to create a temporary test database.");
var databaseName = "serwis_tests_" + Guid.NewGuid().ToString("N");
var connectionSettings = new NpgsqlConnectionStringBuilder(connectionString) { Database = "postgres", Timeout = 10 };
await using var administrativeConnection = new NpgsqlConnection(connectionSettings.ConnectionString);
await administrativeConnection.OpenAsync();
var databaseCreated = false;
Process? server = null;
try
{
    await new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", administrativeConnection).ExecuteNonQueryAsync();
    databaseCreated = true;
    connectionSettings.Database = databaseName;
    var databaseOptions = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connectionSettings.ConnectionString).Options;
    await using (var database = new AppDbContext(databaseOptions))
        await database.Database.MigrateAsync();
    Check(true, "Full migration chain applies to an empty database");

    var listener = new TcpListener(IPAddress.Loopback, 0);
    listener.Start();
    var port = ((IPEndPoint)listener.LocalEndpoint).Port;
    listener.Stop();
    var serverStart = new ProcessStartInfo("dotnet") { UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true };
#if DEBUG
    serverStart.ArgumentList.Add(Path.GetFullPath("SerwisSystem.Api/bin/Debug/net10.0/SerwisSystem.Api.dll"));
#else
    serverStart.ArgumentList.Add(Path.GetFullPath("SerwisSystem.Api/bin/Release/net10.0/SerwisSystem.Api.dll"));
#endif
    serverStart.WorkingDirectory = Path.GetFullPath("SerwisSystem.Api");
    serverStart.ArgumentList.Add("--urls");
    serverStart.ArgumentList.Add($"http://127.0.0.1:{port}");
    serverStart.Environment["ASPNETCORE_ENVIRONMENT"] = "Production";
    serverStart.Environment["ConnectionStrings__DefaultConnection"] = connectionSettings.ConnectionString;
    serverStart.Environment["Jwt__Key"] = "isolated-regression-tests-only-signing-key-123456789";
    serverStart.Environment["FirstAdmin__Username"] = "Main Administrator";
    serverStart.Environment["FirstAdmin__Email"] = "admin@example.invalid";
    serverStart.Environment["FirstAdmin__Password"] = "test-password-123";
    serverStart.Environment["RateLimits__RepairCreatePermitLimit"] = "2";
    server = Process.Start(serverStart)!;
    var serverOutput = server.StandardOutput.ReadToEndAsync();
    var serverErrors = server.StandardError.ReadToEndAsync();
    using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}"), Timeout = TimeSpan.FromSeconds(40) };
    for (var attempt = 0; ; attempt++)
    {
        if (server.HasExited) throw new Exception("Test API exited: " + await serverErrors);
        try { if ((await client.GetAsync("/")).StatusCode == HttpStatusCode.NotFound) break; }
        catch (HttpRequestException) { }
        if (attempt >= 50) throw new Exception("Test API did not start.");
        await Task.Delay(200);
    }
    async Task<JsonObject> Read(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode) throw new Exception($"Unexpected HTTP {(int)response.StatusCode}: {content}");
        return JsonNode.Parse(content)!.AsObject();
    }
    async Task<string> Login(string name, string password = "test-password-123") =>
        (await Read(await client.PostAsJsonAsync("/api/auth/login", new { usernameOrEmail = name, password })))["token"]!.GetValue<string>();
    async Task CheckError(HttpResponseMessage response, int status)
    {
        var error = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Check((int)response.StatusCode == status && error["status"]!.GetValue<int>() == status && !string.IsNullOrWhiteSpace(error["message"]?.GetValue<string>()), $"HTTP {status} uses the shared error response");
    }
    await CheckError(await client.GetAsync("/api/users/logged"), 401);
    await CheckError(await client.GetAsync("/missing-route"), 404);
    await CheckError(await client.PostAsJsonAsync("/api/auth/login", new { usernameOrEmail = "main administrator", password = "wrong-password" }), 401);
    await CheckError(await client.PostAsJsonAsync("/api/auth/login", new { }), 400);
    var invalidLogin = await client.PostAsJsonAsync("/api/auth/login", new { usernameOrEmail = "main administrator", password = "incorrect" });
    var loginError = JsonNode.Parse(await invalidLogin.Content.ReadAsStringAsync())!.AsObject();
    Check(loginError["message"]!.GetValue<string>() == "Nieprawidłowa nazwa użytkownika, adres e-mail lub hasło.", "Login errors are displayed in Polish");
    var invalidFields = await client.PostAsJsonAsync("/api/auth/login", new { });
    var validationError = await invalidFields.Content.ReadAsStringAsync();
    Check(!validationError.Contains("The ") && !validationError.Contains("field is required"), "Required-field validation does not expose English framework messages");
    var administratorToken = await Login("main administrator");
    var parsedToken = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().ReadJwtToken(administratorToken);
    Check(Math.Abs((parsedToken.ValidTo - DateTime.UtcNow).TotalHours - 10) < 0.01, "New login tokens expire after ten hours");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", administratorToken);
    var administrator = await Read(await client.GetAsync("/api/users/logged"));
    var administratorId = administrator["id"]!.GetValue<int>();
    await CheckError(await client.PutAsJsonAsync("/api/users/not-an-id", new { }), 404);
    Check(administrator["priority"]!.GetValue<int>() == 1, "Initial administrator comes from configuration");
    Check((await client.DeleteAsync($"/api/users/{administratorId}")).StatusCode == HttpStatusCode.BadRequest, "Self-deletion is rejected");
    Check((await client.PutAsJsonAsync($"/api/users/{administratorId}/demote-admin", new { })).StatusCode == HttpStatusCode.BadRequest, "Administrators cannot demote themselves");
    Check((await client.PostAsJsonAsync("/api/auth/create-first-admin", new { })).StatusCode == HttpStatusCode.NotFound, "Public first-admin endpoint is removed");
    var worker = await Read(await client.PostAsJsonAsync("/api/auth/register", new { username = "Anna Kowalska", email = "anna@example.invalid", password = "test-password-123" }));
    var workerId = worker["id"]!.GetValue<int>();
    var colleague = await Read(await client.PostAsJsonAsync("/api/auth/register", new { username = "Jan Nowak", email = "jan@example.invalid", password = "test-password-123" }));
    var colleagueId = colleague["id"]!.GetValue<int>();
    Check((await client.PostAsJsonAsync("/api/auth/register", new { username = "ANNA KOWALSKA", email = "other@example.invalid", password = "test-password-123" })).StatusCode == HttpStatusCode.BadRequest, "Normalized usernames are unique");
    await Read(await client.PutAsJsonAsync($"/api/users/grant/{workerId}", new { permissionsGranted = new[] { "ReadUsers", "GrantUsers" }, permissionsRevoked = Array.Empty<string>() }));
    var workerToken = await Login("anna@example.invalid");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", workerToken);
    Check((await client.PutAsJsonAsync($"/api/users/grant/{administratorId}", new { permissionsGranted = new[] { "ReadUsers" } })).StatusCode == HttpStatusCode.Forbidden, "Workers cannot alter administrator permissions");
    await Read(await client.PutAsJsonAsync($"/api/users/grant/{colleagueId}", new { permissionsGranted = new[] { "ReadUsers" } }));
    Check(true, "Delegated workers can grant a permission they possess");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", administratorToken);
    var search = await Read(await client.GetAsync("/api/users?search=anna&sortBy=priority&descending=true"));
    Check(search["totalCount"]!.GetValue<int>() == 1, "User search and priority sort translate to SQL");

    var submission = new { product = "Laptop", isCustomProduct = false, description = "Screen issue", reporterName = "Customer", reporterSurname = "Example", reporterPhone = "123456789", reporterEmail = "customer@example.invalid", companyName = "Example", companyAddress = "Street 1", companyPostalCode = "00-001", companyCity = "Warsaw", companyNip = "5260250274", serviceDataConsent = true };
    var receipt = await Read(await client.PostAsJsonAsync("/api/repairs", submission));
    Check(!receipt.ContainsKey("id") && receipt["trackingCode"]!.GetValue<string>().Length == 8, "Customer receipt exposes a tracking code, not an ID");
    var tracked = await Read(await client.PostAsJsonAsync("/api/repairs/check", new { code = receipt["trackingCode"]!.GetValue<string>().ToLowerInvariant(), email = "CUSTOMER@example.invalid" }));
    Check(!tracked.ContainsKey("id"), "Customer lookup works without ID or optional serial");
    Check((await client.PostAsJsonAsync("/api/repairs/check", new { code = receipt["trackingCode"]!.GetValue<string>(), email = "wrong@example.invalid" })).StatusCode == HttpStatusCode.NotFound, "Tracking lookup checks email");
    var repairs = await Read(await client.GetAsync("/api/repairs"));
    var repair = repairs["items"]![0]!.AsObject();
    var repairId = repair["id"]!.GetValue<int>();
    Check(repair["repairMethod"]!.GetValue<string>() == "Shipping", "New repairs default to shipping");
    var shippingRepairs = await Read(await client.GetAsync("/api/repairs?repairMethods=Shipping&statuses=Pending"));
    Check(shippingRepairs["totalCount"]!.GetValue<int>() == 1, "Repair method and status filters combine");
    var onSiteRepairs = await Read(await client.GetAsync("/api/repairs?repairMethods=OnSite&repairMethods=TechnicianVisit"));
    Check(onSiteRepairs["totalCount"]!.GetValue<int>() == 0, "Multiple repair method filters exclude shipping repairs");
    var pdfResponse = await client.GetAsync($"/api/repairs/{repairId}/pdf");
    Check(pdfResponse.IsSuccessStatusCode && pdfResponse.Content.Headers.ContentType?.MediaType == "application/pdf", "Authorized staff can download repair PDFs");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", workerToken);
    Check((await client.GetAsync($"/api/repairs/{repairId}/pdf")).StatusCode == HttpStatusCode.Forbidden, "PDF download requires ReadRepairs");
    Check((await client.PostAsJsonAsync($"/api/repairs/{repairId}/retry-notification", new { version = repair["version"]!.GetValue<uint>() })).StatusCode == HttpStatusCode.Forbidden, "Notification retry requires EditRepairs");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", administratorToken);
    repair["repairMethod"] = "UnknownMethod";
    Check((await client.PutAsJsonAsync($"/api/repairs/{repairId}", repair)).StatusCode == HttpStatusCode.BadRequest, "Invalid repair methods are rejected");
    repair["repairMethod"] = "TechnicianVisit";
    repair = await Read(await client.PutAsJsonAsync($"/api/repairs/{repairId}", repair));
    Check(repair["repairMethodNotificationPending"]!.GetValue<bool>(), "SMTP failure preserves the saved repair and pending notification");
    repair = await Read(await client.PostAsJsonAsync($"/api/repairs/{repairId}/retry-notification", new { version = repair["version"]!.GetValue<uint>() }));
    Check(repair["repairMethodNotificationPending"]!.GetValue<bool>(), "Failed retry remains available after reload");
    repair["repairMethod"] = "Shipping";
    repair = await Read(await client.PutAsJsonAsync($"/api/repairs/{repairId}", repair));
    Check(!repair["repairMethodNotificationPending"]!.GetValue<bool>(), "Returning to shipping clears obsolete notifications");
    var version = repair["version"]!.GetValue<uint>();
    repair["description"] = "Worker correction";
    var updated = await Read(await client.PutAsJsonAsync($"/api/repairs/{repairId}", repair));
    Check(updated["description"]!.GetValue<string>() == "Worker correction", "A laptop with no serial can be edited");
    Check((await client.PutAsJsonAsync($"/api/repairs/{repairId}", repair)).StatusCode == HttpStatusCode.Conflict, "Stale form saves are rejected");
    var currentVersion = updated["version"]!.GetValue<uint>();
    var claims = await Task.WhenAll(client.PostAsJsonAsync($"/api/repairs/{repairId}/take", new { version = currentVersion }), client.PostAsJsonAsync($"/api/repairs/{repairId}/take", new { version = currentVersion }));
    Check(claims.Count(response => response.IsSuccessStatusCode) == 1, "Only one concurrent repair claim succeeds");
    var assignedProfile = await Read(await client.GetAsync("/api/users/logged"));
    Check(assignedProfile["repairs"]![0]!["workerUsername"]!.GetValue<string>() == "Main Administrator", "User repair responses include the assigned worker name");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", workerToken);
    var restrictedProfile = await Read(await client.GetAsync($"/api/users/{administratorId}"));
    Check(restrictedProfile["repairs"] == null || restrictedProfile["repairs"]!.AsArray().Count == 0, "ReadUsers does not expose another worker's repairs");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", administratorToken);
    await Read(await client.PutAsJsonAsync($"/api/users/grant/{workerId}", new { permissionsGranted = new[] { "EditRepairs", "ReadRepairs" } }));
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", workerToken);
    repair = await Read(await client.GetAsync($"/api/repairs/{repairId}"));
    repair["status"] = "Completed";
    await Read(await client.PutAsJsonAsync($"/api/repairs/{repairId}", repair));
    Check(true, "Authorized workers can edit another worker's repair status");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", administratorToken);
    await Read(await client.PutAsJsonAsync($"/api/users/{workerId}/promote-admin", new { }));
    await Read(await client.PutAsJsonAsync($"/api/users/{workerId}/priority", new { priority = 999 }));
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", workerToken);
    Check((await client.PutAsJsonAsync($"/api/users/{colleagueId}/promote-admin", new { })).StatusCode == HttpStatusCode.BadRequest, "Priority 999 cannot promote anyone");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", administratorToken);
    await Read(await client.PutAsJsonAsync($"/api/users/{colleagueId}/promote-admin", new { }));
    await Read(await client.PutAsJsonAsync($"/api/users/{colleagueId}/priority", new { priority = 999 }));
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", workerToken);
    await Read(await client.PutAsJsonAsync($"/api/users/{colleagueId}/demote-admin", new { }));
    Check(true, "Equal-priority administrators can demote each other");
    await Read(await client.PutAsJsonAsync("/api/users/changePassword", new { currentPassword = "test-password-123", newPassword = "replacement-password" }));
    Check((await client.GetAsync("/api/users/logged")).StatusCode == HttpStatusCode.Unauthorized, "Changing password invalidates old tokens");
    client.DefaultRequestHeaders.Authorization = null;
    var secondSubmission = System.Text.Json.JsonSerializer.SerializeToNode(submission)!.AsObject();
    secondSubmission["serialNumber"] = "Original-123";
    var secondReceipt = await Read(await client.PostAsJsonAsync("/api/repairs", secondSubmission));
    Check((await client.PostAsJsonAsync("/api/repairs/check", new { code = secondReceipt["trackingCode"]!.GetValue<string>(), email = "customer@example.invalid", serialNumber = "wrong" })).StatusCode == HttpStatusCode.NotFound, "Original serial is required when submitted");
    await Read(await client.PostAsJsonAsync("/api/repairs/check", new { code = secondReceipt["trackingCode"]!.GetValue<string>(), email = "customer@example.invalid", serialNumber = "original-123" }));
    Check(true, "Lookup accepts original serial without format validation");
    Check((await client.PostAsJsonAsync("/api/repairs", submission)).StatusCode == HttpStatusCode.TooManyRequests, "Creation rate limit returns 429");
    Console.WriteLine($"All {checks} regression checks passed.");
}
finally
{
    if (server != null && !server.HasExited) { server.Kill(entireProcessTree: true); await server.WaitForExitAsync(); }
    server?.Dispose();
    NpgsqlConnection.ClearAllPools();
    if (databaseCreated)
        await new NpgsqlCommand($"DROP DATABASE \"{databaseName}\" WITH (FORCE)", administrativeConnection).ExecuteNonQueryAsync();
}
