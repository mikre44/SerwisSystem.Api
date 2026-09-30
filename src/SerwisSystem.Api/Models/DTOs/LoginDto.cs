using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class LoginDto
{
    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(100, ErrorMessage = ValidationMessages.MaxLength)]
    public string UsernameOrEmail { get; set; } = "";

    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(50, ErrorMessage = ValidationMessages.MaxLength)]
    public string Password { get; set; } = "";
}