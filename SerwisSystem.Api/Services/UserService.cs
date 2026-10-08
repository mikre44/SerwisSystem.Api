using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using System.Security.Claims;
namespace SerwisSystem.Api.Services;
public class UserService(AppDbContext database)
{
    private Task<User?>? currentUserRequest;
    public Task<User?> GetCurrentUser(ClaimsPrincipal authenticatedUser, CancellationToken cancellationToken = default)
    {
        if (!int.TryParse(authenticatedUser.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Task.FromResult<User?>(null);
        return currentUserRequest ??= database.Users.Include(user => user.Permissions)
            .SingleOrDefaultAsync(user => user.Id == userId, cancellationToken);
    }
}
