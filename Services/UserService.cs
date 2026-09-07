using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using System.Security.Claims;

namespace SerwisSystem.Api.Services;

public class UserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetCurrentUser(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out int userId))
            return null;

        return await _context.Users
            .Include(u => u.Permissions)
            .Include(u => u.Repairs)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }
}