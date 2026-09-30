using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class ChangePasswordDto
{
    [Required(ErrorMessage = ValidationMessages.Required)]
    public string CurrentPassword { get; set; } = "";

    [Required(ErrorMessage = ValidationMessages.Required)]
    [MinLength(6, ErrorMessage = ValidationMessages.MinLength)]
    [MaxLength(50, ErrorMessage = ValidationMessages.MaxLength)]
    public string NewPassword { get; set; } = "";
}