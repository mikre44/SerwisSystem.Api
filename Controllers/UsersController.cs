using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;

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

    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
            return NotFound();

        return Ok(user);
    }


    [HttpGet]// GET api/users
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users.ToListAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]// GET api/users/**id**
    public async Task<IActionResult> GetUserById(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound();
        return Ok(user);
    }

    [HttpPost]// POST api/users
    public async Task<IActionResult> CreateUser(User user)// --------------------------probably will be removed
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
    }


    [HttpPut("{id}")]// PUT api/users/**id**]
    public async Task<IActionResult> UpdateUser(int id, User updatedUser)// --------------------------probably will be removed too cuz of security reasons
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
            return NotFound();

        user.Username = updatedUser.Username;
        user.Email = updatedUser.Email;

        await _context.SaveChangesAsync();
        return Ok(user);
    }

    [HttpDelete("{id}")]// DELETE api/users/**id**
    public async Task<IActionResult> DeleteUser(int id)// this might stay but will be changed too 
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
            return NotFound();

        _context.Users.Remove(user);

        await _context.SaveChangesAsync();
        return Ok(user);
    }
}