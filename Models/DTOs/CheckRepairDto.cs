using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class CheckRepairDto
{
    [Required]
    [MaxLength(100)]
    public string SerialNumber { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";
}