using System.ComponentModel.DataAnnotations;
namespace SerwisSystem.Api.Models.DTOs;
public class CheckRepairDto
{
    [Required(ErrorMessage = "To pole jest wymagane."), RegularExpression("^[A-Za-z2-9]{8}$", ErrorMessage = "Kod musi zawierać 8 liter lub cyfr od 2 do 9.")]
    public string Code { get; set; } = "";
    [Required(ErrorMessage = "To pole jest wymagane."), EmailAddress(ErrorMessage = "Nieprawidłowy adres e-mail."), MaxLength(254, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string Email { get; set; } = "";
    [MaxLength(100, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string? SerialNumber { get; set; }
}
