using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using System.Security.Claims;

namespace SerwisSystem.Api.Services;

public class UserService
{
    private const string CurrentUserKey = "CurrentUser";

    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    // Returns the logged-in user with their permissions (without repairs).
    // PermissionHandler and the controller action both need the user in the same request,
    // so the result is cached in HttpContext.Items and the database is queried only once.
    public async Task<User?> GetCurrentUser(ClaimsPrincipal principal)
    {
        var httpContext = _httpContextAccessor.HttpContext;

        if (httpContext?.Items[CurrentUserKey] is User cachedUser)
            return cachedUser;

        if (!int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out int userId))
            return null;

        var user = await _context.Users
            .Include(u => u.Permissions)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user != null && httpContext != null)
            httpContext.Items[CurrentUserKey] = user;

        return user;
    }

    // Loads a user together with permissions and assigned repairs, for the profile pages.
    public async Task<User?> GetUserWithRepairs(int userId)
    {
        return await _context.Users
            .Include(u => u.Permissions)
            .Include(u => u.Repairs)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }
}
