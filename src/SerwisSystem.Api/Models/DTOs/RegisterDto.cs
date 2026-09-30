using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class RegisterDto
{
    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(50, ErrorMessage = ValidationMessages.MaxLength)]
    public string Username { get; set; } = "";

    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(100, ErrorMessage = ValidationMessages.MaxLength)]
    [EmailAddress(ErrorMessage = ValidationMessages.Email)]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = ValidationMessages.Required)]
    [MinLength(6, ErrorMessage = ValidationMessages.MinLength)]
    [MaxLength(50, ErrorMessage = ValidationMessages.MaxLength)]
    public string Password { get; set; } = "";
}