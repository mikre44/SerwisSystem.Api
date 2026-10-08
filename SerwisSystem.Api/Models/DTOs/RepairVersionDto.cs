using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class RepairVersionDto
{
    [Required(ErrorMessage = "To pole jest wymagane.")]
    [Range(typeof(uint), "1", "4294967295", ErrorMessage = "Nieprawidłowa wersja danych. Odśwież stronę.")]
    public uint? Version { get; set; }
}
