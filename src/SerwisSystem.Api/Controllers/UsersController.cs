using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SerwisSystem.Api.Authorization;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Models.Enums;
using SerwisSystem.Api.Services;

namespace SerwisSystem.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PermissionService _permissionService;
    private readonly UserService _userService;
    private readonly IPasswordHasher<User> _passwordHasher;

    public UsersController(
        AppDbContext context,
        PermissionService permissionService,
        UserService userService,
        IPasswordHasher<User> passwordHasher)
    {
        _context = context;
        _permissionService = permissionService;
        _userService = userService;
        _passwordHasher = passwordHasher;
    }

    private UserResponseDto ToDto(User user, UserResponseOption option)
    {
        var response = new UserResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            Priority = user.Priority,
            CreatedAt = user.CreatedAt
        };

        if (option == UserResponseOption.Permissions || option == UserResponseOption.All)
        {
            var permissions = user.Permissions == null ? null : new PermissionsResponseDto
            {
                ReadRepairs = user.Permissions.ReadRepairs,
                TakeRepairs = user.Permissions.TakeRepairs,
                EditRepairs = user.Permissions.EditRepairs,
                DeleteRepairs = user.Permissions.DeleteRepairs,

                ReadUsers = user.Permissions.ReadUsers,
                EditUsers = user.Permissions.EditUsers,
                DeleteUsers = user.Permissions.DeleteUsers,
                GrantUsers = user.Permissions.GrantUsers,
                DischargeUsers = user.Permissions.DischargeUsers
            };
            response.Permissions = permissions;
        }

        if (option == UserResponseOption.Repairs || option == UserResponseOption.All)
        {
            response.Repairs = user.Repairs
                .Select(RepairResponseDto.FromEntity)
                .ToList();
        }
        return response;
    }

    [RequirePermission(Permission.ReadUsers)]
    [HttpGet]
    public async Task<IActionResult> GetUsers(
        string? search,
        string sortBy = "priority",
        bool descending = false,
        int page = 1,
        int pageSize = 10)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Users
            .Include(u => u.Permissions)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();

            query = query.Where(u =>
                u.Username.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                u.Role.ToString().ToLower().Contains(search) ||
                u.CreatedAt.ToString().Contains(search));
        }

        // An unknown key is an error in the client, so it gets a 400
        // instead of a silent fallback to the default order.
        IQueryable<User>? sortedQuery = sortBy.ToLowerInvariant() switch
        {
            "id" => descending
                ? query.OrderByDescending(u => u.Id)
                : query.OrderBy(u => u.Id),

            "username" => descending
                ? query.OrderByDescending(u => u.Username)
                : query.OrderBy(u => u.Username),

            "email" => descending
                ? query.OrderByDescending(u => u.Email)
                : query.OrderBy(u => u.Email),

            // Admins first (ascending) or workers first (descending).
            "role" => descending
                ? query.OrderByDescending(u => u.Role == UserRole.Admin ? 0 : 1)
                    .ThenBy(u => u.Username)
                : query.OrderBy(u => u.Role == UserRole.Admin ? 0 : 1)
                    .ThenBy(u => u.Username),

            // Workers have no priority (0 in the database), so they are sorted as the lowest authority:
            // top admin first when ascending, workers first when descending.
            "priority" => descending
                ? query.OrderByDescending(u => u.Role == UserRole.Admin ? u.Priority : int.MaxValue)
                    .ThenBy(u => u.Username)
                : query.OrderBy(u => u.Role == UserRole.Admin ? u.Priority : int.MaxValue)
                    .ThenBy(u => u.Username),

            "createdat" => descending
                ? query.OrderByDescending(u => u.CreatedAt)
                : query.OrderBy(u => u.CreatedAt),

            _ => null
        };

        if (sortedQuery == null)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: $"Nieznana wartość sortBy '{sortBy}'. Dozwolone wartości: " +
                        "id, username, email, role, priority, createdAt.");
        }

        query = sortedQuery;

        var totalCount = await query.CountAsync();

        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            Items = users.Select(u => ToDto(u, UserResponseOption.Permissions)),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUserById(int id)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return CurrentUserMissing();

        if (!_permissionService.HasPermission(user, Permission.ReadUsers) && user.Id != id)
            return Problem(statusCode: StatusCodes.Status403Forbidden, detail: "Nie masz uprawnień do przeglądania tego użytkownika.");

        var targetUser = await _userService.GetUserWithRepairs(id);

        if (targetUser == null)
            return UserNotFound();

        return Ok(ToDto(targetUser, UserResponseOption.All));
    }

    [HttpGet("logged")]
    public async Task<IActionResult> GetLoggedUser()
    {
        var currentUser = await _userService.GetCurrentUser(User);

        if (currentUser == null)
            return CurrentUserMissing();

        // GetCurrentUser skips the repairs; the profile page is one of the few places that shows them.
        var user = await _userService.GetUserWithRepairs(currentUser.Id);

        if (user == null)
            return CurrentUserMissing();

        return Ok(ToDto(user, UserResponseOption.All));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updatedUser)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return CurrentUserMissing();

        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return UserNotFound();

        // Everyone may edit their own account; editing someone else needs EditUsers
        // and, for an admin, a higher authority.
        if (user.Id != id)
        {
            if (!_permissionService.HasPermission(user, Permission.EditUsers))
                return Problem(statusCode: StatusCodes.Status403Forbidden, detail: "Nie masz uprawnień do edycji tego użytkownika.");

            if (!_permissionService.CanManageTargetUser(user, targetUser))
                return CannotManageTargetUser();
        }

        // "u.Id != id" lets the user keep their own username while changing only the email (and vice versa).
        if (await _context.Users.AnyAsync(u => u.Username == updatedUser.Username && u.Id != id))
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Ta nazwa użytkownika jest już zajęta.");

        var email = EmailNormalizer.Normalize(updatedUser.Email);

        // ToLower() on the column also matches accounts saved before emails were normalised.
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email && u.Id != id))
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Ten adres e-mail jest już zajęty.");

        targetUser.Username = updatedUser.Username;
        targetUser.Email = email;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Another request took the same username or email between the checks above and this update.
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Nazwa użytkownika lub adres e-mail jest już zajęty.");
        }

        return Ok(ToDto(targetUser, UserResponseOption.OnlyUser));
    }

    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return CurrentUserMissing();

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);

        if (result == PasswordVerificationResult.Failed)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Obecne hasło jest nieprawidłowe.");

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Hasło zostało zmienione."
        });
    }

    [RequirePermission(Permission.DeleteUsers)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return CurrentUserMissing();

        if (user.Id == id)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Nie możesz usunąć własnego konta.");

        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return UserNotFound();

        // Deleting an admin needs an admin with a higher authority, so the top admin is never deleted.
        if (!_permissionService.CanManageTargetUser(user, targetUser))
            return CannotManageTargetUser();

        _context.Users.Remove(targetUser);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [RequirePermission(Permission.GrantUsers)]
    [HttpPut("grant/{id:int}")]
    public async Task<IActionResult> GrantUser(int id, UpdatePermissionsDto dto)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return CurrentUserMissing();

        if (user.Id == id)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Nie możesz zmienić własnych uprawnień.");

        var targetUser = await _context.Users
            .Include(u => u.Permissions)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return UserNotFound();

        if (!_permissionService.CanManageTargetUser(user, targetUser))
            return CannotManageTargetUser();

        // Parse every requested name before changing anything, so a bad request changes nothing.
        if (!TryParsePermissions(dto.PermissionsGranted, out var granted, out var invalidName) ||
            !TryParsePermissions(dto.PermissionsRevoked, out var revoked, out invalidName))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: $"Nieznane uprawnienie: {invalidName}.");
        }

        var targetPermissions = targetUser.Permissions ??= new Permissions();

        // Only the permissions whose value really changes count. Granting something the user
        // already has (or revoking something they do not have) changes nothing, so it needs no rights.
        var changes = granted.Select(permission => (Permission: permission, Value: true))
            .Concat(revoked.Select(permission => (Permission: permission, Value: false)))
            .Where(change => _permissionService.HasPermission(targetPermissions, change.Permission) != change.Value)
            .ToList();

        // You can only give or take away a permission you have yourself.
        foreach (var change in changes)
        {
            if (!_permissionService.HasPermission(user, change.Permission))
            {
                return Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    detail: $"Nie możesz nadać ani odebrać uprawnienia „{PermissionNames.DisplayName(change.Permission)}”, " +
                            "ponieważ go nie posiadasz.");
            }
        }

        foreach (var change in changes)
            _permissionService.SetPermission(targetPermissions, change.Permission, change.Value);

        await _context.SaveChangesAsync();

        return Ok(ToDto(targetUser, UserResponseOption.Permissions));
    }

    // Parses the permission names sent by the frontend (still plain strings, see UpdatePermissionsDto)
    // into Permission values. Returns false and the offending name on the first unknown one.
    private static bool TryParsePermissions(List<string> names, out List<Permission> permissions, out string? invalidName)
    {
        permissions = new List<Permission>(names.Count);

        foreach (var name in names)
        {
            if (!PermissionNames.TryParse(name, out var permission))
            {
                invalidName = name;
                return false;
            }

            permissions.Add(permission);
        }

        invalidName = null;
        return true;
    }

    [HttpPut("{id:int}/promote-admin")]
    public async Task<IActionResult> PromoteToAdmin(int id)
    {
        var currentUser = await _userService.GetCurrentUser(User);

        if (currentUser == null)
            return CurrentUserMissing();

        if (currentUser.Role != UserRole.Admin)
            return AdminOnly();

        if (currentUser.Id == id)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Nie możesz nadać sobie roli administratora.");

        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return UserNotFound();

        if (targetUser.Role == UserRole.Admin)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Ten użytkownik jest już administratorem.");

        targetUser.Role = UserRole.Admin;

        // Give the new admin a lower authority than the current admin.
        targetUser.Priority = currentUser.Priority + 1;

        await _context.SaveChangesAsync();

        return Ok(ToDto(targetUser, UserResponseOption.OnlyUser));
    }

    [HttpPut("{id:int}/priority")]
    public async Task<IActionResult> UpdateAdminPriority(int id, UpdatePriorityDto dto)
    {
        var currentUser = await _userService.GetCurrentUser(User);

        if (currentUser == null)
            return CurrentUserMissing();

        if (currentUser.Role != UserRole.Admin)
            return AdminOnly();

        if (currentUser.Id == id)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Nie możesz zmienić własnego priorytetu.");

        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return UserNotFound();

        if (targetUser.Role != UserRole.Admin)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Ten użytkownik nie jest administratorem.");

        if (!_permissionService.CanManageTargetUser(currentUser, targetUser))
            return CannotManageTargetUser();

        // The same rule as CanManageTargetUser: after the change you must still have more authority
        // (a lower number) than the admin you are editing.
        if (dto.Priority <= currentUser.Priority)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: $"Priorytet musi być większy niż Twój ({currentUser.Priority}).");
        }

        targetUser.Priority = dto.Priority;

        await _context.SaveChangesAsync();

        return Ok(ToDto(targetUser, UserResponseOption.OnlyUser));
    }

    [HttpGet("admins")]
    public async Task<IActionResult> GetAdmins()
    {
        var currentUser = await _userService.GetCurrentUser(User);

        if (currentUser == null)
            return CurrentUserMissing();

        if (currentUser.Role != UserRole.Admin)
            return AdminOnly();

        var admins = await _context.Users
            .Where(u => u.Role == UserRole.Admin)
            .OrderBy(u => u.Priority)
            .ThenBy(u => u.Username)
            .ToListAsync();

        return Ok(admins.Select(u => ToDto(u, UserResponseOption.OnlyUser)));
    }

    [HttpPut("{id:int}/demote-admin")]
    public async Task<IActionResult> DemoteAdmin(int id)
    {
        var currentUser = await _userService.GetCurrentUser(User);

        if (currentUser == null)
            return CurrentUserMissing();

        if (currentUser.Role != UserRole.Admin)
            return AdminOnly();

        if (currentUser.Id == id)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Nie możesz odebrać sobie roli administratora.");

        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return UserNotFound();

        if (targetUser.Role != UserRole.Admin)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Ten użytkownik nie jest administratorem.");

        if (!_permissionService.CanManageTargetUser(currentUser, targetUser))
            return CannotManageTargetUser();

        targetUser.Role = UserRole.Worker;
        targetUser.Priority = 0;

        await _context.SaveChangesAsync();

        return Ok(ToDto(targetUser, UserResponseOption.OnlyUser));
    }

    private ObjectResult CurrentUserMissing() =>
        Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Twoje konto już nie istnieje.");

    private ObjectResult UserNotFound() =>
        Problem(statusCode: StatusCodes.Status404NotFound, detail: "Nie znaleziono użytkownika.");

    private ObjectResult AdminOnly() =>
        Problem(statusCode: StatusCodes.Status403Forbidden, detail: "Tylko administrator może wykonać tę operację.");

    private ObjectResult CannotManageTargetUser() =>
        Problem(statusCode: StatusCodes.Status403Forbidden, detail: "Nie możesz zarządzać administratorem o takich samych lub wyższych uprawnieniach.");
}
