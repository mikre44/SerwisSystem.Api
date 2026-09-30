using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Npgsql;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Services;

namespace SerwisSystem.Api.Tests.Infrastructure;

// Starts the whole API in memory (no real HTTP port) against a real PostgreSQL database.
// One instance is shared by all integration tests, see ApiCollection.
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    // The first admin that FirstAdminSeeder creates from configuration at startup.
    public const string AdminUsername = "admin";
    public const string AdminEmail = "admin@example.com";
    public const string AdminPassword = "Admin123!";

    // The same database as in CI. Locally, point ConnectionStrings__DefaultConnection
    // at your own server (the database name must contain "test").
    private const string DefaultConnectionString =
        "Host=localhost;Port=5432;Database=serwissystem_test;Username=postgres;Password=postgres";

    public static string ConnectionString { get; } = GetConnectionString();

    // The database is created once per test run, even when a test starts a second factory.
    private static readonly Lazy<Task> DatabaseCreated = new(RecreateDatabaseAsync);

    // Tests register, log in and create repairs through the rate-limited public endpoints
    // many times a minute, so the limit is raised.
    // null keeps the limit from appsettings.json (used by the test that checks the limit itself).
    public int? PublicPermitLimit { get; init; } = 10_000;

    // Collects the emails the API "sends" instead of talking to an SMTP server.
    public FakeEmailSender EmailSender { get; } = new();

    public Task InitializeAsync() => DatabaseCreated.Value;

    Task IAsyncLifetime.DisposeAsync() => DisposeAsync().AsTask();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Not "Development": that environment would also load the developer's user-secrets.
        builder.UseEnvironment("Testing");

        // UseSetting values are visible in Program.cs before the app is built,
        // so they also reach settings read directly from builder.Configuration.
        builder.UseSetting("ConnectionStrings:DefaultConnection", ConnectionString);
        builder.UseSetting("Jwt:Key", "integration-tests-only-signing-key-0123456789abcdef");
        builder.UseSetting("FirstAdmin:Username", AdminUsername);
        builder.UseSetting("FirstAdmin:Email", AdminEmail);
        builder.UseSetting("FirstAdmin:Password", AdminPassword);

        if (PublicPermitLimit != null)
            builder.UseSetting("RateLimiting:PublicPermitLimit", PublicPermitLimit.Value.ToString());

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IEmailSender>();
            services.AddSingleton<IEmailSender>(EmailSender);
        });
    }

    private static string GetConnectionString()
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? DefaultConnectionString;

        var database = new NpgsqlConnectionStringBuilder(connectionString).Database ?? "";

        // The database is dropped at the start of every run, so refuse anything that
        // does not look like a test database (e.g. the development database by mistake).
        if (!database.Contains("test", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Tests drop and recreate the database '{database}'. " +
                "Use a database whose name contains 'test'.");
        }

        return connectionString;
    }

    // A fresh database for every run: no data left over from the previous run,
    // and all migrations are applied exactly like in production.
    private static async Task RecreateDatabaseAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;

        await using var context = new AppDbContext(options);

        await context.Database.EnsureDeletedAsync();
        await context.Database.MigrateAsync();
    }
}
