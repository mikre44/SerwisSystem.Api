using SerwisSystem.Api.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class UpdateRepairDto
{
    public RepairStatus? Status { get; set; }

    [Required]
    public ProductCategory ProductCategory { get; set; }

    [Required]
    [MaxLength(200)]
    public string Product { get; set; } = "";

    public bool IsCustomProduct { get; set; }

    [MaxLength(100)]
    public string? SerialNumber { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = "";


    // Reporting person

    [Required]
    [MaxLength(100)]
    public string ReporterName { get; set; } = "";

    [Required]
    [MaxLength(100)]
    public string ReporterSurname { get; set; } = "";

    [Required]
    [RegularExpression(
            @"^(\+)?\d{7,15}$",
            ErrorMessage = "Invalid phone number."
        )]
    public string ReporterPhone { get; set; } = "";

    [Required]
    [EmailAddress]
    public string ReporterEmail { get; set; } = "";


    // Company

    [Required]
    [MaxLength(200)]
    public string CompanyName { get; set; } = "";

    [Required]
    [MaxLength(200)]
    public string CompanyAddress { get; set; } = "";

    [Required]
    [RegularExpression(
        @"^\d{2}-\d{3}$",
        ErrorMessage = "Postal code must have format XX-XXX."
    )]
    public string CompanyPostalCode { get; set; } = "";

    [Required]
    [MaxLength(100)]
    public string CompanyCity { get; set; } = "";

    [Required]
    [RegularExpression(
        @"^\d{10}$",
        ErrorMessage = "NIP must contain exactly 10 digits."
    )]
    public string CompanyNip { get; set; } = "";


    // Warranty

    public bool HasWarranty { get; set; }

    public DateOnly? PurchaseDate { get; set; }

    [MaxLength(100)]
    public string? PurchaseInvoiceNumber { get; set; }


    // Contract

    public bool HasContract { get; set; }

    [MaxLength(100)]
    public string? ContractNumber { get; set; }


    // Consents

    public bool ServiceDataConsent { get; set; }

    public bool MarketingConsent { get; set; }
}