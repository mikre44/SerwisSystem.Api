using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Services;

// Creates the first admin at startup, so there is no anonymous "create admin" endpoint that
// anyone could call. The account comes from configuration (user-secrets or environment variables):
// FirstAdmin:Username, FirstAdmin:Email, FirstAdmin:Password.
public class FirstAdminSeeder
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IConfiguration _configuration;
    private readonly ILogger<FirstAdminSeeder> _logger;

    public FirstAdminSeeder(
        AppDbContext context,
        IPasswordHasher<User> passwordHasher,
        IConfiguration configuration,
        ILogger<FirstAdminSeeder> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        // The seeder runs before anyone had a chance to apply migrations (e.g. on a fresh database),
        // and querying tables that do not exist yet would crash the whole API at startup.
        if ((await _context.Database.GetPendingMigrationsAsync()).Any())
        {
            _logger.LogWarning(
                "The database has pending migrations, so the first admin was not created. " +
                "Apply migrations first (dotnet ef database update) and restart the API.");
            return;
        }

        if (await _context.Users.AnyAsync(u => u.Role == UserRole.Admin))
            return;

        var username = _configuration["FirstAdmin:Username"];
        var email = _configuration["FirstAdmin:Email"];
        var password = _configuration["FirstAdmin:Password"];

        if (string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning(
                "There is no admin account. Set FirstAdmin:Username, FirstAdmin:Email and FirstAdmin:Password " +
                "(user-secrets or FirstAdmin__* environment variables) and restart the API to create one.");
            return;
        }

        email = EmailNormalizer.Normalize(email);

        if (await _context.Users.AnyAsync(u => u.Username == username || u.Email.ToLower() == email))
        {
            _logger.LogWarning(
                "Cannot create the first admin: username '{Username}' or email '{Email}' is already taken.",
                username, email);
            return;
        }

        var admin = new User
        {
            Username = username,
            Email = email,
            Role = UserRole.Admin,
            Priority = 1, // the highest authority
            Permissions = new Permissions
            {
                ReadRepairs = true,
                TakeRepairs = true,
                EditRepairs = true,
                DeleteRepairs = true,
                ReadUsers = true,
                EditUsers = true,
                DeleteUsers = true,
                GrantUsers = true,
                DischargeUsers = true
            }
        };
        admin.PasswordHash = _passwordHasher.HashPassword(admin, password);

        _context.Users.Add(admin);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created the first admin '{Username}'.", username);
    }
}
