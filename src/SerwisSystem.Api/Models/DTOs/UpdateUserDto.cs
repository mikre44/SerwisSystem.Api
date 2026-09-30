using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class UpdateUserDto
{
    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = "";

    [Required]
    [MaxLength(100)]
    [EmailAddress]
    public string Email { get; set; } = "";
}