using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Authorization;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Models.Enums;
using SerwisSystem.Api.Services;
using System.Security.Claims;


namespace SerwisSystem.Api.Controllers;

[Authorize]
[ApiController]// indicates that this class is an API controller
[Route("api/[controller]")]// route for the controller so its api/repairs
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;// acces to database
    private readonly PermissionService _permissionService; // acces to the permission service
    private readonly UserService _userService;


    public UsersController(
        AppDbContext context,
        PermissionService permissionService,
        UserService userService)
    {
        _context = context;
        _permissionService = permissionService;
        _userService = userService;
    }

    private UserResponseDto CreateUserResponse(User user, UserResponseOption option)
    {
        var response =  new UserResponseDto
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
            var repairs = user.Repairs
            .Select(repair => RepairResponseMapper.CreateResponse(repair, user.Username))
            .ToList();
            response.Repairs = repairs;
        }
        return response;
    }

    [RequirePermission("ReadUsers")]
    [HttpGet]// GET api/users
    public async Task<IActionResult> GetUsers(
    string? search,
    string sortBy = "role",
    bool descending = false,
    int page = 1,
    int pageSize = 10)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Users
            .Include(u => u.Permissions)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();

            query = query.Where(u =>
                u.Username.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                (u.Role == UserRole.Admin ? "admin" : "worker").Contains(search) ||
                u.CreatedAt.ToString().Contains(search)
            );
        }

        query = sortBy.ToLower() switch
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

            "priority" => descending ? query.OrderByDescending(u => u.Priority) : query.OrderBy(u => u.Priority),
            "role" => descending
                ? query.OrderByDescending(u => u.Role == UserRole.Admin)
                    .ThenByDescending(u => u.Role == UserRole.Admin ? u.Priority : 0)
                    .ThenByDescending(u => u.Username)
                : query.OrderByDescending(u => u.Role == UserRole.Admin)
                    .ThenBy(u => u.Role == UserRole.Admin ? u.Priority : 0)
                    .ThenBy(u => u.Username),

            "createdat" => descending
                ? query.OrderByDescending(u => u.CreatedAt)
                : query.OrderBy(u => u.CreatedAt),

            _ => query
                .OrderBy(u => u.Role == UserRole.Admin ? 0 : 1)
                .ThenBy(u => u.Role == UserRole.Admin ? u.Priority : 0)
                .ThenBy(u => u.Username)
        };

        var totalCount = await query.CountAsync(HttpContext.RequestAborted);

        var users = await ((IOrderedQueryable<User>)query)
            .ThenBy(u => u.Id)
            .Skip((int)Math.Min((long)(page - 1) * pageSize, int.MaxValue))
            .Take(pageSize)
            .ToListAsync(HttpContext.RequestAborted);

        return Ok(new
        {
            Items = users.Select(u =>
                CreateUserResponse(u, UserResponseOption.Permissions)),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(
                totalCount / (double)pageSize
            )
        });
    }


    [HttpGet("{id:int}")]// GET api/users/**id**
    public async Task<IActionResult> GetUserById(int id)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return Unauthorized();

        if (!_permissionService.HasPermission(user, "ReadUsers") && user.Id != id)
            return Forbid();

        var targetUser = await _context.Users
            .Include(u => u.Permissions)
            .Include(u => u.Repairs)
            .FirstOrDefaultAsync(u => u.Id == id, HttpContext.RequestAborted);

        if (targetUser == null)
            return NotFound();

        return Ok(CreateUserResponse(targetUser, user.Id == id || _permissionService.HasPermission(user, "ReadRepairs")
            ? UserResponseOption.All : UserResponseOption.Permissions));
    }


    [HttpGet("logged")]//api/logged
    public async Task<IActionResult> GetLoggedUser()
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return Unauthorized();

        var profile = await _context.Users.Include(account => account.Permissions).Include(account => account.Repairs)
            .SingleAsync(account => account.Id == user.Id, HttpContext.RequestAborted);
        return Ok(CreateUserResponse(profile, UserResponseOption.All));
    }


    [HttpPut("{id:int}")]// PUT api/users/**id**]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updatedUser)
    {
        var user = await _userService.GetCurrentUser(User);

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);


        if (user == null)
            return Unauthorized();

        if (targetUser == null)
            return NotFound();

        if (!_permissionService.HasPermission(user, "EditUsers") && user.Id != id)
            return Forbid();


        if (!_permissionService.CanManageTargetUser(user, targetUser))
            return Forbid();


        var existingUsername = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedUsername == UserIdentity.Normalize(updatedUser.Username) && u.Id != id);
        //this checks if the new username is already used, and if it is checks if its ur username (u might want to only change the email)

        var existingEmail = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == UserIdentity.Normalize(updatedUser.Email) && u.Id != id);


        if (existingUsername != null)
            return BadRequest(new ApiErrorResponse(400, "Ta nazwa użytkownika jest już zajęta."));
        else if (existingEmail != null)
            return BadRequest(new ApiErrorResponse(400, "Ten adres e-mail jest już używany."));

        UserIdentity.Apply(targetUser, updatedUser.Username, updatedUser.Email);

        await _context.SaveChangesAsync();
        return Ok(CreateUserResponse(targetUser, UserResponseOption.OnlyUser));
    }


    [HttpPut("changePassword")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return Unauthorized();

        var passwordHasher = new PasswordHasher<User>();

        var result = passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            dto.CurrentPassword
        );

        if (result == PasswordVerificationResult.Failed)
            return BadRequest(new ApiErrorResponse(400, "Obecne hasło jest nieprawidłowe."));

        user.PasswordHash = passwordHasher.HashPassword(
            user,
            dto.NewPassword
        );

        user.SessionVersion = Guid.NewGuid();
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Hasło zostało zmienione. Zaloguj się ponownie."
        });
    }


    [RequirePermission("DeleteUsers")]
    [HttpDelete("{id:int}")]// DELETE api/users/**id**
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _userService.GetCurrentUser(User);

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);


        if (user == null)
            return Unauthorized();
        if (targetUser == null)
            return NotFound();

        if (!_permissionService.CanManageTargetUser(user, targetUser))
            return Forbid();

        if (user.Id == targetUser.Id) return BadRequest(new ApiErrorResponse(400, "Nie możesz usunąć własnego konta."));
        await using var transaction = await _context.Database.BeginTransactionAsync();
        await _context.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(87439212)");
        if (targetUser.Role == UserRole.Admin && await _context.Users.CountAsync(account => account.Role == UserRole.Admin) <= 1)
            return BadRequest(new ApiErrorResponse(400, "Nie można usunąć ostatniego administratora."));
        await _context.Repairs.Where(repair => repair.UserId == id && repair.Status == RepairStatus.InProgress)
            .ExecuteUpdateAsync(updates => updates.SetProperty(repair => repair.Status, RepairStatus.Pending)
                .SetProperty(repair => repair.UserId, (int?)null));
        _context.Users.Remove(targetUser);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        return NoContent();
    }


    [RequirePermission("GrantUsers")]
    [HttpPut("grant/{id:int}")]// PUT api/users/grant/**id**]
    public async Task<IActionResult> GrantUser(int id, UpdatePermissionsDto dto)
    {

        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        if (user.Permissions == null && user.Role != UserRole.Admin)
            return BadRequest(new ApiErrorResponse(400, "Twoje konto nie ma uprawnień."));

        if (user.Id == id)// user cant change his own
            return Forbid();

        var targetUser = await _context.Users
            .Include(u => u.Permissions)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return NotFound();

        if (!_permissionService.CanManageTargetUser(user, targetUser)) return Forbid();

        if (targetUser.Permissions == null)
            return BadRequest(new ApiErrorResponse(400, "Wybrany użytkownik nie ma uprawnień."));


        if (dto.PermissionsGranted.Intersect(dto.PermissionsRevoked).Any())
            return BadRequest(new ApiErrorResponse(400, "Nie można jednocześnie nadać i odebrać tego samego uprawnienia."));
        foreach (var permission in dto.PermissionsGranted.Concat(dto.PermissionsRevoked))
            if (string.IsNullOrWhiteSpace(permission) || typeof(Permissions).GetProperty(permission)?.PropertyType != typeof(bool))
                return BadRequest(new ApiErrorResponse(400, "Nieprawidłowe uprawnienie."));

        foreach (var permission in dto.PermissionsGranted)
        {

            if (!_permissionService.HasPermission(user, permission))
                return Forbid();

            var property = typeof(Permissions).GetProperty(permission);

            if (property == null || property.PropertyType != typeof(bool))
                return BadRequest(new ApiErrorResponse(400, $"Nieprawidłowe uprawnienie."));

            property.SetValue(targetUser.Permissions, true );
        }

        foreach (var permission in dto.PermissionsRevoked)
        {
            if (!_permissionService.HasPermission(user, permission))
                return Forbid();

            var property = typeof(Permissions).GetProperty(permission);

            if (property == null || property.PropertyType != typeof(bool))
                return BadRequest(new ApiErrorResponse(400, $"Nieprawidłowe uprawnienie."));

            property.SetValue(targetUser.Permissions, false);
        }


        await _context.SaveChangesAsync();

        return Ok(CreateUserResponse(targetUser, UserResponseOption.Permissions));
    }

    [HttpPut("{id:int}/promote-admin")]
    public async Task<IActionResult> PromoteToAdmin(int id)
    {
        var currentUser = await _userService.GetCurrentUser(User);

        if (currentUser == null)
            return Unauthorized();

        if (currentUser.Role != UserRole.Admin)
            return Forbid();

        if (currentUser.Id == id)
            return BadRequest(new ApiErrorResponse(400, "Nie możesz samodzielnie nadać sobie uprawnień administratora."));

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return NotFound();

        if (targetUser.Role == UserRole.Admin)
            return BadRequest(new ApiErrorResponse(400, "Użytkownik jest już administratorem."));

        if (currentUser.Priority >= AdminRules.MaximumPriority)
            return BadRequest(new ApiErrorResponse(400, "Administrator z priorytetem 999 nie może nadawać uprawnień administratora."));
        targetUser.Role = UserRole.Admin;

        // Give the new admin a lower authority than the current admin.
        targetUser.Priority = currentUser.Priority + 1;

        await _context.SaveChangesAsync();

        return Ok(CreateUserResponse(targetUser, UserResponseOption.OnlyUser));
    }


    [HttpPut("{id:int}/priority")]
    public async Task<IActionResult> UpdateAdminPriority(
    int id,
    UpdatePriorityDto dto)
    {
        var currentUser = await _userService.GetCurrentUser(User);

        if (currentUser == null)
            return Unauthorized();

        if (currentUser.Role != UserRole.Admin)
            return Forbid();

        if (currentUser.Id == id)
            return BadRequest(new ApiErrorResponse(400, "Nie możesz zmienić własnego priorytetu."));

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return NotFound();

        if (targetUser.Role != UserRole.Admin)
            return BadRequest(new ApiErrorResponse(400, "Wybrany użytkownik nie jest administratorem."));

        if (!_permissionService.CanManageTargetUser(
            currentUser,
            targetUser))
        {
            return Forbid();
        }

        if (dto.Priority < currentUser.Priority)//smaller priority - higher authority
        {
            return BadRequest(new ApiErrorResponse(400, "Nie możesz nadać administratorowi wyższego poziomu uprawnień niż własny."));
        }

        if (dto.Priority < 1)
        {
            return BadRequest(new ApiErrorResponse(400, "Priorytet musi wynosić co najmniej 1."));
        }

        targetUser.Priority = dto.Priority;

        await _context.SaveChangesAsync();

        return Ok(CreateUserResponse(targetUser, UserResponseOption.OnlyUser));
    }


    [HttpGet("admins")]
    public async Task<IActionResult> GetAdmins()
    {
        var currentUser = await _userService.GetCurrentUser(User);

        if (currentUser == null)
            return Unauthorized();

        if (currentUser.Role != UserRole.Admin)
            return Forbid();

        var admins = await _context.Users
            .Where(u => u.Role == UserRole.Admin)
            .OrderBy(u => u.Priority)
            .ThenBy(u => u.Username)
            .ToListAsync(HttpContext.RequestAborted);

        return Ok(admins.Select(u =>
            CreateUserResponse(u, UserResponseOption.OnlyUser)));
    }


    [HttpPut("{id:int}/demote-admin")]
    public async Task<IActionResult> DemoteAdmin(int id)
    {
        var currentUser = await _userService.GetCurrentUser(User);

        if (currentUser == null)
            return Unauthorized();

        if (currentUser.Role != UserRole.Admin)
            return Forbid();

        if (currentUser.Id == id)
            return BadRequest(new ApiErrorResponse(400, "Nie możesz odebrać sobie uprawnień administratora."));

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return NotFound();

        if (targetUser.Role != UserRole.Admin)
            return BadRequest(new ApiErrorResponse(400, "Wybrany użytkownik nie jest administratorem."));

        if (!_permissionService.CanManageTargetUser(currentUser, targetUser))
            return Forbid();

        await using var transaction = await _context.Database.BeginTransactionAsync();
        await _context.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(87439212)");
        if (await _context.Users.CountAsync(account => account.Role == UserRole.Admin) <= 1)
            return BadRequest(new ApiErrorResponse(400, "Nie można odebrać uprawnień ostatniemu administratorowi."));
        targetUser.Role = UserRole.Worker;
        targetUser.Priority = 0;

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(CreateUserResponse(
            targetUser,
            UserResponseOption.OnlyUser
        ));
    }
}