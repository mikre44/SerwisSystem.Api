using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class UpdateUserDto
{
    [Required(ErrorMessage = "To pole jest wymagane.")]
    [MaxLength(50, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    [RegularExpression(@"^[^@]+$", ErrorMessage = "Nazwa użytkownika nie może zawierać znaku @.")]
    public string Username { get; set; } = "";

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [MaxLength(100, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    [EmailAddress(ErrorMessage = "Nieprawidłowy adres e-mail.")]
    public string Email { get; set; } = "";
}