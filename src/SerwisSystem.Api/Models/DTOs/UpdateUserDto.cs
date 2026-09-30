using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class UpdateUserDto
{
    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(50, ErrorMessage = ValidationMessages.MaxLength)]
    public string Username { get; set; } = "";

    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(100, ErrorMessage = ValidationMessages.MaxLength)]
    [EmailAddress(ErrorMessage = ValidationMessages.Email)]
    public string Email { get; set; } = "";
}