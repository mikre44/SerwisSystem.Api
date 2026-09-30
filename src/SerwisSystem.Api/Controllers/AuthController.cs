using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using SerwisSystem.Api.Authorization;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SerwisSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly JwtOptions _jwtOptions;

    public AuthController(
        AppDbContext context,
        IPasswordHasher<User> passwordHasher,
        IOptions<JwtOptions> jwtOptions)
    {
        _context = context;
        _passwordHasher = passwordHasher;
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

    // Rate limited, because anyone can call it without logging in.
    [EnableRateLimiting("public")]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Ta nazwa użytkownika jest już zajęta.");

        var email = EmailNormalizer.Normalize(dto.Email);

        // ToLower() on the column also matches accounts saved before emails were normalised.
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email))
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Ten adres e-mail jest już zajęty.");

        var user = new User
        {
            Username = dto.Username,
            Email = email,
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
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "Nazwa użytkownika lub adres e-mail jest już zajęty.");
        }

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.Role
        });
    }

    // Rate limited to slow down guessing passwords.
    [EnableRateLimiting("public")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        // The username must match exactly; the email in any letter case.
        var email = EmailNormalizer.Normalize(dto.UsernameOrEmail);

        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.Username == dto.UsernameOrEmail || u.Email.ToLower() == email);

        // The same answer for an unknown user and a wrong password, so nobody can probe which accounts exist.
        if (user == null ||
            _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password) == PasswordVerificationResult.Failed)
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Nieprawidłowy login lub hasło.");
        }

        var token = GenerateToken(user);
        return Ok(new
        {
            token,
            user.Role
        });
    }
}
