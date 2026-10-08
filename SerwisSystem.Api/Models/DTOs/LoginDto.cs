using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class LoginDto
{
    [Required(ErrorMessage = "To pole jest wymagane.")]
    [MaxLength(100, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string UsernameOrEmail { get; set; } = "";//username or email

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [MaxLength(50, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string Password { get; set; } = "";
}