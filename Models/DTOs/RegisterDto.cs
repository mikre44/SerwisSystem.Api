using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class RegisterDto
{
    [Required]
    [MaxLength(50)]

    public string Username { get; set; } = "";

    [Required]
    [MaxLength(100)]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    [MinLength(6)]
    [MaxLength(50)]
    public string Password { get; set; } = "";
}