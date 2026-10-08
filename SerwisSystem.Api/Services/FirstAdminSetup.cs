using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Services;

public static class FirstAdminSetup
{
    public static async Task InitializeAsync(IServiceProvider services, IConfiguration configuration)
    {
        await using var scope = services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await using var transaction = await database.Database.BeginTransactionAsync();
        await database.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(87439211)");
        if (await database.InitialSetups.AnyAsync()) return;

        if (!await database.Users.AnyAsync(user => user.Role == UserRole.Admin))
        {
            var credentials = configuration.GetSection("FirstAdmin").Get<RegisterDto>()
                ?? throw new InvalidOperationException("Configure FirstAdmin:Username, Email and Password in secrets before first startup.");
            Validator.ValidateObject(credentials, new ValidationContext(credentials), true);
            var administrator = new User { Role = UserRole.Admin, Priority = 1, Permissions = new Permissions() };
            UserIdentity.Apply(administrator, credentials.Username, credentials.Email);
            administrator.PasswordHash = new PasswordHasher<User>().HashPassword(administrator, credentials.Password);
            database.Users.Add(administrator);
        }

        database.InitialSetups.Add(new InitialSetup { Id = 1 });
        await database.SaveChangesAsync();
        await transaction.CommitAsync();
    }
}
