using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class CheckRepairDto
{
    [Required]
    public int Id { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";
}