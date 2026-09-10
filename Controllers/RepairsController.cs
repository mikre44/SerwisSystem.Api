using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using SerwisSystem.Api.Models.Enums;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Services;
using SerwisSystem.Api.Authorization;


namespace SerwisSystem.Api.Controllers;

[Authorize]
[ApiController]// indicates that this class is an API controller
[Route("api/[controller]")]// route for the controller so its api/repairs

public class RepairsController : ControllerBase
{
    private readonly AppDbContext _context;// acces to database
    private readonly PermissionService _permissionService; // acces to the permission service
    private readonly UserService _userService;// pretty obvious tbh


    public RepairsController(
        AppDbContext context,
        PermissionService permissionService,
        UserService userService)
    {
        _context = context;
        _permissionService = permissionService;
        _userService = userService;
    }

    private RepairResponseDto ToDto(Repair repair)
    {
        var repairResponse = new RepairResponseDto
        {
            Id = repair.Id,
            SerialNumber = repair.SerialNumber,
            Status = repair.Status,
            Product = repair.Product,
            Description = repair.Description,
            Name = repair.Name,
            Surname = repair.Surname,
            PhoneNumber = repair.PhoneNumber,
            Address = repair.Address,
            Email = repair.Email,
            NIP = repair.NIP,
            CreatedAt = repair.CreatedAt
        };
        if (repair.User != null)
        {
            repairResponse.WorkerUsername = repair.User.Username;
        }
        return repairResponse;
    }



    [RequirePermission("ReadRepairs")]
    [HttpGet]// GET api/repairs 
    public async Task<IActionResult> GetRepairs()
    {
        var repairs = await _context.Repairs
            .Include(r => r.User)
            .ToListAsync();

        return Ok(repairs.Select(r => ToDto(r)));
    }




    [RequirePermission("ReadRepairs")]
    [HttpGet("{id}")]// GET api/repairs/**id**
    public async Task<IActionResult> GetRepair(int id)
    {
        var repair = await _context.Repairs
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (repair == null)
            return NotFound();

        return Ok(ToDto(repair));
    }




    [RequirePermission("EditRepairs")]
    [HttpPost]// POST api/repairs
    public async Task<IActionResult> CreateRepair(CreateRepairDto dto)
    {
        var repair = new Repair
        {
            Product = dto.Product,
            Description = dto.Description,
            Name = dto.Name,
            Surname = dto.Surname,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            Address = dto.Address,
            NIP = dto.NIP
        };

        _context.Repairs.Add(repair);// add the repair to the database context
        await _context.SaveChangesAsync();// save the changes to the database

        return CreatedAtAction(
            nameof(GetRepair),
            new { id = repair.Id },
            ToDto(repair)
        );
    }




    [RequirePermission("EditRepairs")]
    [HttpPut("{id}")]// PUT api/repairs/**id**
    public async Task<IActionResult> UpdateRepair(int id, UpdateRepairDto updatedRepair)
    {
        var repair = await _context.Repairs.FindAsync(id);

        if (repair == null)
            return NotFound();

        repair.Status = updatedRepair.Status == null ? repair.Status : (RepairStatus)updatedRepair.Status;
        repair.Product = updatedRepair.Product;
        repair.Description = updatedRepair.Description;
        repair.Name = updatedRepair.Name;
        repair.Surname = updatedRepair.Surname;
        repair.PhoneNumber = updatedRepair.PhoneNumber;
        repair.Email = updatedRepair.Email;
        repair.Address = updatedRepair.Address;
        repair.NIP = updatedRepair.NIP;

        await _context.SaveChangesAsync();

        return Ok(ToDto(repair));

    }




    [RequirePermission("DeleteRepairs")]
    [HttpDelete("{id}")]// DELETE api/repairs/**id**
    public async Task<IActionResult> DeleteRepair(int id)
    {
        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        var repair = await _context.Repairs.FindAsync(id);

        if (repair == null)
            return NotFound();

        _context.Repairs.Remove(repair);
        await _context.SaveChangesAsync();

        return NoContent();
    }




    [RequirePermission("TakeRepairs")]
    [HttpPost("{id}/take")]// POST api/repairs/**id**/take
    public async Task<IActionResult> TakeRepair(int id)
    {
        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        var repair = await _context.Repairs
        .Include(r => r.User)
        .FirstOrDefaultAsync(r => r.Id == id);

        if (repair == null)
            return NotFound();

        if (repair.UserId != null)
            return BadRequest("Repair already assigned to a user");
        if (repair.Status != RepairStatus.Pending)
            return BadRequest("Repait must be pending");

        repair.UserId = user.Id;
        repair.User = user;
        repair.Status = RepairStatus.InProgress;

        await _context.SaveChangesAsync();

        return Ok(ToDto(repair));

    }




    [HttpPost("{id}/complete")]// POST api/repairs/**id**/complete
    public async Task<IActionResult> CompleteRepair(int id)
    {
        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        var repair = await _context.Repairs
        .Include(r => r.User)
        .FirstOrDefaultAsync(r => r.Id == id);

        if (repair == null)
            return NotFound();

        if (repair.UserId == null)
            return BadRequest("Repair has not been assigned to any user");

        if (user.Role != UserRole.Admin && user.Id != repair.UserId)
            return BadRequest("Repair is assigned to a different user");

        if (repair.Status != RepairStatus.InProgress)
            return BadRequest("Only repairs in progress can be completed");

        repair.Status = RepairStatus.Completed;

        await _context.SaveChangesAsync();

        return Ok(ToDto(repair));

    }




    [RequirePermission("EditRepairs")]
    [HttpPost("{id}/cancel")]// POST api/repairs/**id**/cancel
    public async Task<IActionResult> CancelRepair(int id)
    {
        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        var repair = await _context.Repairs
        .Include(r => r.User)
        .FirstOrDefaultAsync(r => r.Id == id);

        if (repair == null)
            return NotFound();

        if (repair.Status == RepairStatus.Completed)
            return BadRequest("Repair is already Completed");

        if (repair.Status == RepairStatus.Cancelled)
            return BadRequest("Repair has already been cancelled.");

        if (user.Role != UserRole.Admin && user.Id != repair.UserId)
            return BadRequest("Repair is assigned to a different user");

        repair.Status = RepairStatus.Cancelled;

        await _context.SaveChangesAsync();

        return Ok(ToDto(repair));

    }




    [HttpPost("{id}/return")]// POST api/repairs/**id**/return
    public async Task<IActionResult> ReturnRepair(int id) 
    {
        var repair = await _context.Repairs.FindAsync(id);

        if (repair == null)
            return NotFound();

        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return Unauthorized();

        if (!_permissionService.HasPermission(user, "DischargeUsers") && user.Id != repair.UserId)
            return Forbid();

        if (repair.Status == RepairStatus.Completed)
            return BadRequest("Repair has already been completed");

        if (repair.Status == RepairStatus.Cancelled)
            return BadRequest("Repair has already been cancelled");

        repair.UserId = null;
        repair.Status = RepairStatus.Pending;

        await _context.SaveChangesAsync();

        return Ok(ToDto(repair));

    }
}