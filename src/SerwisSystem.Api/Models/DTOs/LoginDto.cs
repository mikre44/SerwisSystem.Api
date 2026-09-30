using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class LoginDto
{
    [Required]
    [MaxLength(100)]
    public string UsernameOrEmail { get; set; } = "";//username or email

    [Required]
    [MaxLength(50)]
    public string Password { get; set; } = "";
}