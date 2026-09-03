using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.DTOs;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;


namespace SerwisSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

public class  AuthController : ControllerBase  
{

    private string GenerateToken(User user)
    {
        var claims = new[]// what will be stored in tokens (id,username,role)
        {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.Username),
        new Claim(ClaimTypes.Role, user.Role.ToString())
    };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes("THIS_IS_MY_SUPER_SECRET_KEY_123456789")// this will be the key that encodes it
        );

        var credentials = new SigningCredentials(//yo im using this ^ key with this algorithm ig 
            key,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(// the token XD
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }



    private readonly AppDbContext _context;// access to database
    private readonly PasswordHasher<User> _passwordHasher;
    

    public AuthController(AppDbContext context)
    {
        _context = context;
        _passwordHasher = new PasswordHasher<User>();
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var existingUsername = await _context.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
        var existingEmail = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (existingUsername != null)
            return BadRequest("Username already exists");
        else if (existingEmail != null)
            return BadRequest("Email already exists");
        
        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.Role
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == dto.UsernameOrEmail || u.Email == dto.UsernameOrEmail);

        if (user == null)
            return BadRequest("Username not found");


        var result =_passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password); // put it here to make the code more readable

        if (result == PasswordVerificationResult.Failed)
            return BadRequest("Invalid password");

        _context.Users.Add(user);

        var token = GenerateToken(user);
        return Ok(new
        {
           token
        });
    }

}