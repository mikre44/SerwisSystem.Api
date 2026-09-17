using SerwisSystem.Api.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class UpdateRepairDto
{

    public RepairStatus? Status {  get; set; }

    [Required]
    [MaxLength(100)]
    public string Product { get; set; } = "";

    [Required]
    [MaxLength(100)]
    public string SerialNumber { get; set; } = "";

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = "";


    public string Name { get; set; } = "";


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

    [Range(0, 9999999999)]
    public long NIP { get; set; } = 0;
}