using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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

    [HttpGet]// GET api/repairs 
    public async Task<IActionResult> GetRepairs()
    {

        var repairs = await _context.Repairs
            .Include(r => r.User)// include user information in the repair list(probaly cuz of the relationship idk)
            .ToListAsync();//ig it transfers to list

        return Ok(repairs);// return the list of repairs with user information
    }

    [HttpGet("{id}")]// GET api/repairs/**id**
    public async Task<IActionResult> GetRepair(int id)
    {
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
        _context.Repairs.Add(repair);// add the repair to the database context
        await _context.SaveChangesAsync();// save the changes to the database

        return CreatedAtAction(
            nameof(GetRepair),
            new { id = repair.Id },
            repair
        );
    }

    [HttpPost("{id}/take")]// POST api/repairs/**id**/take
    public async Task<IActionResult> AssignUserId(int id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);// takes the id in token

        if (!int.TryParse(userIdClaim, out int userId))// baisically int.Parse(...) but it TRIES to change it cuz somehow it might not be a number (even tho we have "[Authorize]" at line 10 which allows this code to work only if someone has a token
            return Unauthorized();

        var repair = await _context.Repairs.FindAsync(id);
        var user = await _context.Users.FindAsync(userId);// some might say its useless but what if the admin deletes your account while ure still logged? u wont be allowed to do anything now

        if (repair == null)
            return NotFound();

        else if (user == null)
            return Unauthorized();

        if (repair.UserId != null)
            return BadRequest("Repair already assigned to a user");


        repair.UserId = userId;
        repair.Status = Models.Enums.RepairStatus.InProgress;

        await _context.SaveChangesAsync();

        return Ok(repair);
    }

    [HttpPost("{id}/removeUserId")]// POST api/repairs/**id**/return?userId=**userId**
    public async Task<IActionResult> DischargeUserId(int id, int userId)
    {
        var repair = await _context.Repairs.FindAsync(id);
        

        if (repair == null)
            return NotFound();

        repair.UserId = null;

        repair.Status = Models.Enums.RepairStatus.Pending;

        await _context.SaveChangesAsync();

        return Ok(repair);
    }



    [HttpPut("{id}")]// PUT api/repairs/**id**
    public async Task<IActionResult> UpdateRepair(int id, Repair updatedRepair)
    {
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
        var repair = await _context.Repairs.FindAsync(id);

        if (repair == null)
            return NotFound();

        _context.Repairs.Remove(repair);
        await _context.SaveChangesAsync();

        return Ok(repair);
    }

}