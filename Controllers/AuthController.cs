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
    private readonly AppDbContext _context;// access to database
    private readonly PasswordHasher<User> _passwordHasher;
    private readonly IConfiguration _configuration;


    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _passwordHasher = new PasswordHasher<User>();
        _configuration = configuration;
    }


    private string GenerateToken(User user)
    {
        var claims = new[]// what will be stored in tokens (id,username,role)
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var jwtKey = _configuration["Jwt:Key"];

        if (string.IsNullOrEmpty(jwtKey))
        {
            throw new InvalidOperationException("JWT key is not configured.");
        }

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)
        );

        var credentials = new SigningCredentials(//yo im using this ^ key with this algorithm ig 
            key,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
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


        var permissions = new Permissions
        {
            User = user
        };

        user.Permissions = permissions;

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

        var token = GenerateToken(user);
        return Ok(new
        {
           token,
           user.Role
        });
    }

    // idk what i should do with it for now


    //[HttpPost("createAdmin")]//temporarily
    //public async Task<IActionResult> CreateAdmin(RegisterDto dto)
    //{
    //    var existingUsername = await _context.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
    //    var existingEmail = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

    //    if (existingUsername != null)
    //        return BadRequest("Username already exists");
    //    else if (existingEmail != null)
    //        return BadRequest("Email already exists");

    //    var user = new User
    //    {
    //        Username = dto.Username,
    //        Email = dto.Email
    //    };
    //    user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
    //    user.Role = Models.Enums.UserRole.Admin;

    //    var permissions = new Permissions
    //    {
    //        User = user
    //    };

    //    user.Permissions = permissions;
    //    _context.Users.Add(user);

    //    await _context.SaveChangesAsync();

    //    return Ok(new
    //    {
    //        user.Id,
    //        user.Username,
    //        user.Email,
    //        user.Role
    //    });
    //}


}

