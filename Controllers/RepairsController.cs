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


    [HttpGet]// GET api/repairs 
    public async Task<IActionResult> GetRepairs()
    {
        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        if (!_permissionService.HasPermission(user, "ReadRepairs"))
            return Forbid();

        var repairs = await _context.Repairs
            .Include(r => r.User)
            .ToListAsync();

        return Ok(repairs);
    }

    [HttpGet("{id}")]// GET api/repairs/**id**
    public async Task<IActionResult> GetRepair(int id)
    {
        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        if (!_permissionService.HasPermission(user, "ReadRepairs"))
            return Forbid();

        var repair = await _context.Repairs
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (repair == null)
            return NotFound();

        var repairDto = new RepairDto
        {
            Id = repair.Id,
            SerialNumber = repair.SerialNumber,
            Status = repair.Status,
            Product = repair.Product,
            Description = repair.Description,
            Name = repair.Name,
            Surname = repair.Surname,
            PhoneNumber = repair.PhoneNumber,
            Email = repair.Email,
            Address = repair.Address,
            NIP = repair.NIP,
            UserId = repair.UserId
        };

        return Ok(repairDto);
    }


    [HttpPost]// POST api/repairs
    public async Task<IActionResult> CreateRepair(CreateRepairDto dto)
    {
        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        if (!_permissionService.HasPermission(user, "EditRepairs"))
            return Forbid();
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
            repair
        );
    }

    [Authorize(Roles = "Worker,Admin")]
    [HttpPost("{id}/take")]// POST api/repairs/**id**/take
    public async Task<IActionResult> AssignUserId(int id)
    {
        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        if (!_permissionService.HasPermission(user, "TakeRepairs"))
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
        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        if (!_permissionService.HasPermission(user, "DischargeUsers"))
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
    public async Task<IActionResult> UpdateRepair(int id, UpdateRepairDto updatedRepair)
    {
        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        if (!_permissionService.HasPermission(user, "EditRepairs"))
            return Forbid();

        var repair = await _context.Repairs.FindAsync(id);

        if (repair == null)
            return NotFound();

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
        var user = await _userService.GetCurrentUser(User);
        if (user == null)
            return Unauthorized();

        if (!_permissionService.HasPermission(user, "DeleteRepairs"))
            return Forbid();

        var repair = await _context.Repairs.FindAsync(id);

        if (repair == null)
            return NotFound();

        _context.Repairs.Remove(repair);
        await _context.SaveChangesAsync();

        return Ok(repair);
    }

}