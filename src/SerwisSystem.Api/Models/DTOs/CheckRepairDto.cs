using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

// The customer proves they reported the repair with its id
// and the email address given in the form.
public class CheckRepairDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Nieprawidłowy numer naprawy.")]
    public int Id { get; set; }

    [Required(ErrorMessage = ValidationMessages.Required)]
    [EmailAddress(ErrorMessage = ValidationMessages.Email)]
    public string Email { get; set; } = "";
}
