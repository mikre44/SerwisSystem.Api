using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using SerwisSystem.Api.Models.Enums;
namespace SerwisSystem.Api.Controllers;


[ApiController]// indicates that this class is an API controller
[Route("api/[controller]")]// route for the controller so its api/repairs
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;// acces to database

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    private async Task<User?> GetCurrentUserAsync()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out int userId))
            return null;

        return await _context.Users
            .Include(u => u.Permissions)
            .Include(u => u.Repairs)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }



    [HttpGet]// GET api/users
    public async Task<IActionResult> GetUsers()
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return Unauthorized();

        if (user.Role != UserRole.Admin && (user.Permissions == null || !user.Permissions.ReadUsers))
            return Unauthorized();

        var users = await _context.Users
            .Include (u => u.Permissions)
            .Include (u => u.Repairs)
            .ToListAsync();
        return Ok(users);
    }



    [HttpGet("{id}")]// GET api/users/**id**
    public async Task<IActionResult> GetUserById(int id)
    {
        var user = await GetCurrentUserAsync();

        var targetUser = await _context.Users
            .Include(u => u.Permissions)
            .Include(u => u.Repairs)
            .FirstOrDefaultAsync(u => u.Id == id);


        if (user == null)
            return Unauthorized();

        if (user.Role != UserRole.Admin && (user.Permissions == null || !user.Permissions.ReadUsers) && user.Id != id)
            return Forbid();

        return Ok(targetUser);
    }



    [HttpPut("{id}")]// PUT api/users/**id**]
    public async Task<IActionResult> UpdateUser(int id, User updatedUser)
    {
        var user = await GetCurrentUserAsync();

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);


        if (user == null)
            return Unauthorized();

        if (targetUser == null)
            return NotFound();

        if (user.Role != UserRole.Admin && (user.Permissions == null || !user.Permissions.EditUser) && user.Id != id)// the last one checks if ure editing yourself (its false if u do)
            return Forbid();

        if (targetUser.Role == UserRole.Admin && (user.Role != UserRole.Admin || (user.Role == UserRole.Admin && user.Priority > targetUser.Priority)))

        // "higher" priority number means lower priority, number 1 will be the highest(for now at least)
        {
            return Forbid();
        }


        var existingUsername = await _context.Users.FirstOrDefaultAsync(u => u.Username == updatedUser.Username);
        var existingEmail = await _context.Users.FirstOrDefaultAsync(u => u.Email == updatedUser.Email);


        if (existingUsername != null)
            return BadRequest("Username already exists");
        else if (existingEmail != null)
            return BadRequest("Email already exists");

        user.Username = updatedUser.Username;
        user.Email = updatedUser.Email;

        await _context.SaveChangesAsync();
        return Ok(user);
    }


    [HttpDelete("{id}")]// DELETE api/users/**id**
    public async Task<IActionResult> DeleteUser(int id)// this might stay but will be changed too 
    {
        var user = await GetCurrentUserAsync();

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);


        if (user == null)
            return Unauthorized();

        if (targetUser == null)
            return NotFound();

        if (user.Role != UserRole.Admin && (user.Permissions == null || !user.Permissions.DeleteUser))
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
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        Console.WriteLine($"JWT USER ID: {userIdClaim}");


        var user = await GetCurrentUserAsync();
        if (user == null)
        {
            Console.WriteLine("CURRENT USER IS NULL");
            return Unauthorized();
        }

        if (user.Role != UserRole.Admin && (user.Permissions == null || !user.Permissions.GrantUser || user.Id == id))// user cant change his own 
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