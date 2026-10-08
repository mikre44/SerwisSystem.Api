using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class ChangePasswordDto
{
    [Required(ErrorMessage = "To pole jest wymagane.")]
    public string CurrentPassword { get; set; } = "";

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [MinLength(6, ErrorMessage = "Minimalna liczba znaków: {1}.")]
    [MaxLength(50, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string NewPassword { get; set; } = "";
}