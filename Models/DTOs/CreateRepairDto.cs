using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class CreateRepairDto
{
    [Required]
    [MaxLength(100)]
    public string Product { get; set; } = "";

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = "";

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = "";

    [Required]
    [MaxLength(50)]
    public string Surname { get; set; } = "";

    [Required]
    [Phone]
    public string PhoneNumber { get; set; } = "";

    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    [MaxLength(200)]
    public string Address { get; set; } = "";

    [Range(1000000000, 9999999999)]
    public int NIP { get; set; } = 0;
}