namespace SerwisSystem.Api.Models.DTOs;

public class LoginDto
{
    public string UsernameOrEmail { get; set; } = "";//username or email
    public string Password { get; set; } = "";
}