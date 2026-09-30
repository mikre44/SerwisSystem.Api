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
using System.Security.Claims;


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
        var respone =  new UserResponseDto
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
            respone.Permissions = permissions;
        }

        if (option == UserResponseOption.Repairs || option == UserResponseOption.All)
        {
            var repairs = user.Repairs
            .Select(repair => new RepairResponseDto
            {
                Id = repair.Id,

                Status = repair.Status,

                Product = repair.Product,
                IsCustomProduct = repair.IsCustomProduct,
                SerialNumber = repair.SerialNumber,
                Description = repair.Description,

                ReporterName = repair.ReporterName,
                ReporterSurname = repair.ReporterSurname,
                ReporterPhone = repair.ReporterPhone,
                ReporterEmail = repair.ReporterEmail,

                CompanyName = repair.CompanyName,
                CompanyAddress = repair.CompanyAddress,
                CompanyPostalCode = repair.CompanyPostalCode,
                CompanyCity = repair.CompanyCity,
                CompanyNip = repair.CompanyNip,

                HasWarranty = repair.HasWarranty,
                PurchaseDate = repair.PurchaseDate,
                PurchaseInvoiceNumber = repair.PurchaseInvoiceNumber,

                HasContract = repair.HasContract,
                ContractNumber = repair.ContractNumber,

                ServiceDataConsent = repair.ServiceDataConsent,
                MarketingConsent = repair.MarketingConsent,

                WorkerId = repair.UserId,

                CreatedAt = repair.CreatedAt
            })
            .ToList();
            respone.Repairs = repairs;
        }
        return respone;
    }




    [RequirePermission("ReadUsers")]
    [HttpGet]
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
            .Include(u => u.Repairs)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();

            query = query.Where(u =>
                u.Username.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                u.Role.ToString().ToLower().Contains(search) ||
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

        var totalCount = await query.CountAsync();

        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            Items = users.Select(u =>
                ToDto(u, UserResponseOption.Permissions)),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(
                totalCount / (double)pageSize
            )
        });
    }


    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUserById(int id)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return CurrentUserMissing();

        if (!_permissionService.HasPermission(user, "ReadUsers") && user.Id != id)
            return Problem(statusCode: StatusCodes.Status403Forbidden, detail: "You do not have permission to view this user.");

        var targetUser = await _context.Users
            .Include(u => u.Permissions)
            .Include(u => u.Repairs)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return UserNotFound();

        return Ok(ToDto(targetUser, UserResponseOption.All));
    }


    [HttpGet("logged")]
    public async Task<IActionResult> GetLoggedUser()
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return CurrentUserMissing();

        return Ok(ToDto(user, UserResponseOption.All));
    }


    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updatedUser)
    {
        var user = await _userService.GetCurrentUser(User);

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);


        if (user == null)
            return CurrentUserMissing();

        if (targetUser == null)
            return UserNotFound();

        if (!_permissionService.HasPermission(user, "EditUsers") && user.Id != id)
            return Problem(statusCode: StatusCodes.Status403Forbidden, detail: "You do not have permission to edit this user.");


        if (!_permissionService.CanManageTargetUser(user, targetUser))
            return CannotManageTargetUser();


        // "u.Id != id" lets the user keep their own username while changing only the email (and vice versa).
        if (await _context.Users.AnyAsync(u => u.Username == updatedUser.Username && u.Id != id))
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Username already exists.");

        if (await _context.Users.AnyAsync(u => u.Email == updatedUser.Email && u.Id != id))
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Email already exists.");

        targetUser.Username = updatedUser.Username;
        targetUser.Email = updatedUser.Email;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Another request took the same username or email between the checks above and this update.
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Username or email already exists.");
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
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Current password is incorrect.");

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Password changed successfully."
        });
    }


    [RequirePermission("DeleteUsers")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)// this might stay but will be changed too 
    {
        var user = await _userService.GetCurrentUser(User);

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);


        if (user == null)
            return CurrentUserMissing();
        if (targetUser == null)
            return UserNotFound();

        if (!_permissionService.CanManageTargetUser(user, targetUser))
            return CannotManageTargetUser();

        _context.Users.Remove(targetUser);

        await _context.SaveChangesAsync();
        return NoContent();
    }


    [RequirePermission("GrantUsers")]
    [HttpPut("grant/{id:int}")]
    public async Task<IActionResult> GrantUser(int id, UpdatePermissionsDto dto)
    {

        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return CurrentUserMissing();
        
        if (user.Permissions == null && user.Role != UserRole.Admin)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Current user has no permissions.");

        if (user.Id == id)// user cant change his own 
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "You cannot change your own permissions.");

        var targetUser = await _context.Users
            .Include(u => u.Permissions)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return UserNotFound();

        if (targetUser.Permissions == null)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Target user has no permissions.");


        foreach (var permission in dto.PermissionsGranted)
        {

            if (!_permissionService.HasPermission(user, permission))
                return Problem(statusCode: StatusCodes.Status403Forbidden, detail: $"You cannot grant a permission you do not have: {permission}.");

            var property = typeof(Permissions).GetProperty(permission);// converts string to actual property in Permissions.cs

            if (property == null || property.PropertyType != typeof(bool))// checking if its actually bool not some user id or smth
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: $"Invalid permission: {permission}.");

            property.SetValue(targetUser.Permissions, true );// the guy who thought about it is insane or genius
        }

        foreach (var permission in dto.PermissionsRevoked)
        {
            if (!_permissionService.HasPermission(user, permission))
                return Problem(statusCode: StatusCodes.Status403Forbidden, detail: $"You cannot revoke a permission you do not have: {permission}.");

            var property = typeof(Permissions).GetProperty(permission);

            if (property == null || property.PropertyType != typeof(bool))
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: $"Invalid permission: {permission}.");

            property.SetValue(targetUser.Permissions, false);
        }


        await _context.SaveChangesAsync();

        return Ok(ToDto(targetUser, UserResponseOption.Permissions));
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
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "You cannot promote yourself.");

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return UserNotFound();

        if (targetUser.Role == UserRole.Admin)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "User is already an admin.");

        targetUser.Role = UserRole.Admin;

        // Give the new admin a lower authority than the current admin.
        targetUser.Priority = currentUser.Priority + 1;

        await _context.SaveChangesAsync();

        return Ok(ToDto(targetUser, UserResponseOption.OnlyUser));
    }


    [HttpPut("{id:int}/priority")]
    public async Task<IActionResult> UpdateAdminPriority(
    int id,
    UpdatePriorityDto dto)
    {
        var currentUser = await _userService.GetCurrentUser(User);

        if (currentUser == null)
            return CurrentUserMissing();

        if (currentUser.Role != UserRole.Admin)
            return AdminOnly();

        if (currentUser.Id == id)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "You cannot change your own priority.");

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return UserNotFound();

        if (targetUser.Role != UserRole.Admin)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Target user is not an admin.");

        if (!_permissionService.CanManageTargetUser(
            currentUser,
            targetUser))
        {
            return CannotManageTargetUser();
        }

        if (dto.Priority < currentUser.Priority)//smaller priority - higher authority
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "You cannot give an admin higher authority than yourself.");
        }

        if (dto.Priority < 1)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Priority must be at least 1.");
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

        return Ok(admins.Select(u =>
            ToDto(u, UserResponseOption.OnlyUser)));
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
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "You cannot demote yourself.");

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return UserNotFound();

        if (targetUser.Role != UserRole.Admin)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Target user is not an admin.");

        if (!_permissionService.CanManageTargetUser(currentUser, targetUser))
            return CannotManageTargetUser();

        targetUser.Role = UserRole.Worker;
        targetUser.Priority = 0;

        await _context.SaveChangesAsync();

        return Ok(ToDto(
            targetUser,
            UserResponseOption.OnlyUser
        ));
    }

    private ObjectResult CurrentUserMissing() =>
        Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Your account no longer exists.");

    private ObjectResult UserNotFound() =>
        Problem(statusCode: StatusCodes.Status404NotFound, detail: "User not found.");

    private ObjectResult AdminOnly() =>
        Problem(statusCode: StatusCodes.Status403Forbidden, detail: "Only an admin can do this.");

    private ObjectResult CannotManageTargetUser() =>
        Problem(statusCode: StatusCodes.Status403Forbidden, detail: "You cannot manage this user.");
}
