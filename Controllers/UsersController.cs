using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    private readonly UserService _userService;// pretty obvious tbh


    public UsersController(
        AppDbContext context,
        PermissionService permissionService,
        UserService userService)
    {
        _context = context;
        _permissionService = permissionService;
        _userService = userService;
    }



    [HttpGet]// GET api/users
    public async Task<IActionResult> GetUsers()
    {
        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        if (!_permissionService.HasPermission(user, "ReadUsers"))
            return Forbid();


        var users = await _context.Users
            .Include (u => u.Permissions)
            .Include (u => u.Repairs)
            .ToListAsync();
        return Ok(users);
    }



    [HttpGet("{id}")]// GET api/users/**id**
    public async Task<IActionResult> GetUserById(int id)
    {
        var user = await _userService.GetCurrentUser(User);

        var targetUser = await _context.Users
            .Include(u => u.Permissions)
            .Include(u => u.Repairs)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return NotFound();

        if (user == null)
            return Unauthorized();


        if (!_permissionService.HasPermission(user, "ReadUsers") && user.Id != id)
            return Forbid();

        return Ok(targetUser);
    }



    [HttpPut("{id}")]// PUT api/users/**id**]
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


        if (targetUser.Role == UserRole.Admin && (user.Role != UserRole.Admin || (user.Role == UserRole.Admin && user.Priority > targetUser.Priority)))

        // "higher" priority number means lower priority, number 1 will be the highest(for now at least)
        {
            return Forbid();
        }


        var existingUsername = await _context.Users.FirstOrDefaultAsync(u => u.Username == updatedUser.Username && u.Id != id);
        //this checks if the new username is already used, and if it is checks if its ur username (u might want to only change the email)

        var existingEmail = await _context.Users.FirstOrDefaultAsync(u => u.Email == updatedUser.Email && u.Id != id);


        if (existingUsername != null)
            return BadRequest("Username already exists");
        else if (existingEmail != null)
            return BadRequest("Email already exists");

        targetUser.Username = updatedUser.Username;
        targetUser.Email = updatedUser.Email;

        await _context.SaveChangesAsync();
        return Ok(targetUser);
    }


    [HttpDelete("{id}")]// DELETE api/users/**id**
    public async Task<IActionResult> DeleteUser(int id)// this might stay but will be changed too 
    {
        var user = await _userService.GetCurrentUser(User);

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);


        if (user == null)
            return Unauthorized();

        if (targetUser == null)
            return NotFound();

        if (!_permissionService.HasPermission(user, "DeleteUsers") || user.Id == id)
            return Forbid();


        if(targetUser.Role == UserRole.Admin && (user.Role != UserRole.Admin || (user.Role == UserRole.Admin && user.Priority > targetUser.Priority)))

            // "higher" priority number means lower priority, number 1 will be the highest(for now at least)
        {
            return Forbid();
        }


        _context.Users.Remove(targetUser);

        await _context.SaveChangesAsync();
        return Ok(targetUser);
    }

    [HttpPut("grant/{id}")]// PUT api/users/grant/**id**]
    public async Task<IActionResult> GrantUser(int id, UpdatePermissionsDto dto)
    {

        var user = await _userService.GetCurrentUser(User);
        if (user == null)
        {
            return Unauthorized();
        }


        if (!_permissionService.HasPermission(user, "GrantUsers") || user.Id == id)// user cant change his own 
            return Forbid();

        var targetUser = await _context.Users
            .Include(u => u.Permissions)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return NotFound();

        if (targetUser.Permissions == null)
            return BadRequest("Target user has no permissions.");


        foreach (var permission in dto.PermissionsGranted)
        {
            var property = typeof(Permissions).GetProperty(permission);// converts string to actual property in Permissions.cs

            if (property == null || property.PropertyType != typeof(bool))// checking if its actually bool not some user id or smth
                return BadRequest($"Invalid permission: {permission}");

           property.SetValue(targetUser.Permissions, true );// the guy who thought about it is insane or genius
        }

        foreach (var permission in dto.PermissionsRevoked)
        {
            var property = typeof(Permissions).GetProperty(permission);// converts string to actual property in Permissions.cs

            if (property == null || property.PropertyType != typeof(bool))// checking if its actually bool not some user id or smth
                return BadRequest($"Invalid permission: {permission}");

            property.SetValue(targetUser.Permissions, false);// the guy who thought about it is insane or genius
        }

        await _context.SaveChangesAsync();

        return Ok(targetUser);
    }
}