using Microsoft.AspNetCore.RateLimiting;
using SerwisSystem.Api.Services;
﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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
    private readonly IConfiguration _configuration;
    private static readonly string DummyPasswordHash = new PasswordHasher<User>()
        .HashPassword(new User(), Guid.NewGuid().ToString());


    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _passwordHasher = new PasswordHasher<User>();
        _configuration = configuration;
    }


    private string GenerateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("session_version", user.SessionVersion.ToString("N"))
        };

        var jwtKey = _configuration["Jwt:Key"];

        if (string.IsNullOrEmpty(jwtKey))
        {
            throw new InvalidOperationException("JWT key is not configured.");
        }

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "SerwisSystem.Api",
            audience: _configuration["Jwt:Audience"] ?? "SerwisSystem.Staff",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(10),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [EnableRateLimiting("register")]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var existingUsername = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedUsername == UserIdentity.Normalize(dto.Username));
        var existingEmail = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == UserIdentity.Normalize(dto.Email));

        if (existingUsername != null)
            return BadRequest(new ApiErrorResponse(400, "Ta nazwa użytkownika jest już zajęta."));
        else if (existingEmail != null)
            return BadRequest(new ApiErrorResponse(400, "Ten adres e-mail jest już używany."));

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email
        };
        UserIdentity.Apply(user, dto.Username, dto.Email);
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

    [EnableRateLimiting("login")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var identifier = UserIdentity.Normalize(dto.UsernameOrEmail);
        var user = identifier.Contains('@')
            ? await _context.Users.SingleOrDefaultAsync(u => u.NormalizedEmail == identifier)
            : await _context.Users.SingleOrDefaultAsync(u => u.NormalizedUsername == identifier);

        if (user == null)
        {
            _passwordHasher.VerifyHashedPassword(new User(), DummyPasswordHash, dto.Password);
            return Unauthorized(new ApiErrorResponse(401, "Nieprawidłowa nazwa użytkownika, adres e-mail lub hasło."));
        }


        var result =_passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password); // put it here to make the code more readable

        if (result == PasswordVerificationResult.Failed)
            return Unauthorized(new ApiErrorResponse(401, "Nieprawidłowa nazwa użytkownika, adres e-mail lub hasło."));

        var token = GenerateToken(user);
        return Ok(new
        {
           token,
           user.Role
        });
    }

}
