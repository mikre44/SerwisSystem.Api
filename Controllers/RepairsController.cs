using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Controllers;

[Authorize]
[ApiController]// indicates that this class is an API controller
[Route("api/[controller]")]// route for the controller so its api/repairs

public class RepairsController : ControllerBase
{
    private readonly AppDbContext _context;// acces to database

    public RepairsController(AppDbContext context)
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
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    [HttpGet]// GET api/repairs 
    public async Task<IActionResult> GetRepairs()
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return Unauthorized();

        if (user.Role != UserRole.Admin && (user.Permissions == null || !user.Permissions.ReadRepairs))
            return Forbid();

        var repairs = await _context.Repairs
            .Include(r => r.User)
            .ToListAsync();

        return Ok(repairs);
    }

    [HttpGet("{id}")]// GET api/repairs/**id**
    public async Task<IActionResult> GetRepair(int id)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return Unauthorized();

        if (user.Role != UserRole.Admin && (user.Permissions == null || !user.Permissions.ReadRepairs))
            return Forbid();

        var repair = await _context.Repairs
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (repair == null)
            return NotFound();

        return Ok(repair);
    }

    [HttpPost]// POST api/repairs
    public async Task<IActionResult> CreateRepair(Repair repair)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return Unauthorized();

        if (user.Role != UserRole.Admin && (user.Permissions == null || !user.Permissions.EditRepair))
            return Forbid();

        _context.Repairs.Add(repair);// add the repair to the database context
        await _context.SaveChangesAsync();// save the changes to the database

        return CreatedAtAction(
            nameof(GetRepair),
            new { id = repair.Id },
            repair
        );
    }

    [Authorize(Roles = "Worker,Admin")]
    [HttpPost("{id}/take")]// POST api/repairs/**id**/take
    public async Task<IActionResult> AssignUserId(int id)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return Unauthorized();

        if (user.Role != UserRole.Admin && (user.Permissions == null || !user.Permissions.TakeRepair))
            return Forbid();

        var repair = await _context.Repairs.FindAsync(id);

        if (repair == null)
            return NotFound();

        if (repair.UserId != null)
            return BadRequest("Repair already assigned to a user");

        repair.UserId = user.Id;
        repair.Status = RepairStatus.InProgress;

        await _context.SaveChangesAsync();

        return Ok(repair);
    }

    [HttpPost("{id}/removeUserId")]// POST api/repairs/**id**/removeUserId
    public async Task<IActionResult> DischargeUserId(int id)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return Unauthorized();

        if (user.Role != UserRole.Admin && (user.Permissions == null || !user.Permissions.EditRepair))
            return Forbid();

        var repair = await _context.Repairs.FindAsync(id);

        if (repair == null)
            return NotFound();

        repair.UserId = null;
        repair.Status = RepairStatus.Pending;

        await _context.SaveChangesAsync();

        return Ok(repair);
    }



    [HttpPut("{id}")]// PUT api/repairs/**id**
    public async Task<IActionResult> UpdateRepair(int id, Repair updatedRepair)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return Unauthorized();

        if (user.Role != UserRole.Admin && (user.Permissions == null || !user.Permissions.EditRepair))
            return Forbid();

        var repair = await _context.Repairs.FindAsync(id);

        if (repair == null)
            return NotFound();

        repair.SerialNumber = updatedRepair.SerialNumber;// there is a faster way but its too complicated for me to understand rn
        repair.Status = updatedRepair.Status;
        repair.Product = updatedRepair.Product;
        repair.Description = updatedRepair.Description;
        repair.Name = updatedRepair.Name;
        repair.Surname = updatedRepair.Surname;
        repair.PhoneNumber = updatedRepair.PhoneNumber;
        repair.Email = updatedRepair.Email;
        repair.Address = updatedRepair.Address;
        repair.NIP = updatedRepair.NIP;

        await _context.SaveChangesAsync();

        return Ok(repair);
    }

    [HttpDelete("{id}")]// DELETE api/repairs/**id**
    public async Task<IActionResult> DeleteRepair(int id)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return Unauthorized();

        if (user.Role != UserRole.Admin && (user.Permissions == null || !user.Permissions.DeleteRepair))
            return Forbid();

        var repair = await _context.Repairs.FindAsync(id);

        if (repair == null)
            return NotFound();

        _context.Repairs.Remove(repair);
        await _context.SaveChangesAsync();

        return Ok(repair);
    }

}