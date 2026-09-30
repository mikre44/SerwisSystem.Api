using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using SerwisSystem.Api.Authorization;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Models.Enums;
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
    private readonly JwtOptions _jwtOptions;


    public AuthController(AppDbContext context, IOptions<JwtOptions> jwtOptions)
    {
        _context = context;
        _passwordHasher = new PasswordHasher<User>();
        _jwtOptions = jwtOptions.Value;
    }


    private string GenerateToken(User user)
    {
        // Data stored inside the token (the API reads the user id from it on every request).
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }



    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Username already exists.");

        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Email already exists.");

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            Permissions = new Permissions()
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _context.Users.Add(user);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Another request took the same username or email between the checks above and this insert.
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Username or email already exists.");
        }

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

        // The same answer for an unknown user and a wrong password, so nobody can probe which accounts exist.
        if (user == null ||
            _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password) == PasswordVerificationResult.Failed)
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Invalid credentials.");
        }

        var token = GenerateToken(user);
        return Ok(new
        {
           token,
           user.Role
        });
    }

    [AllowAnonymous]
    [HttpPost("create-first-admin")]
    public async Task<IActionResult> CreateFirstAdmin(
    RegisterDto dto)
    {
        var adminExists = await _context.Users
            .AnyAsync(u => u.Role == UserRole.Admin);

        if (adminExists)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "An admin already exists.");
        }

        var existingUser = await _context.Users
            .AnyAsync(u =>
                u.Username == dto.Username ||
                u.Email == dto.Email
            );

        if (existingUser)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Username or email already exists.");
        }

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            Role = UserRole.Admin,
            Priority = 1,
        };

        var hasher = new PasswordHasher<User>();

        user.PasswordHash =
            hasher.HashPassword(
                user,
                dto.Password
            );

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        var permissions = new Permissions
        {
            UserId = user.Id,

            ReadRepairs = true,
            TakeRepairs = true,
            EditRepairs = true,
            DeleteRepairs = true,

            ReadUsers = true,
            EditUsers = true,
            DeleteUsers = true,
            GrantUsers = true,
            DischargeUsers = true
        };

        _context.Permissions.Add(permissions);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "First admin created successfully."
        });
    }


}

