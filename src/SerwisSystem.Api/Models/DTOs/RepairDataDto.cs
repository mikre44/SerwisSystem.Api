using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

// Repair fields shared by the create form (customer app)
// and the edit form (staff app).
public abstract class RepairDataDto
{
    // A name from ProductCatalog, or any name when IsCustomProduct is true.
    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(200, ErrorMessage = ValidationMessages.MaxLength)]
    public string Product { get; set; } = "";

    public bool IsCustomProduct { get; set; }

    [MaxLength(100, ErrorMessage = ValidationMessages.MaxLength)]
    public string? SerialNumber { get; set; }

    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(1000, ErrorMessage = ValidationMessages.MaxLength)]
    public string Description { get; set; } = "";


    // Reporting person

    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(100, ErrorMessage = ValidationMessages.MaxLength)]
    public string ReporterName { get; set; } = "";

    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(100, ErrorMessage = ValidationMessages.MaxLength)]
    public string ReporterSurname { get; set; } = "";

    [Required(ErrorMessage = ValidationMessages.Required)]
    [RegularExpression(
        @"^(\+)?\d{7,15}$",
        ErrorMessage = "Nieprawidłowy numer telefonu."
    )]
    public string ReporterPhone { get; set; } = "";

    [Required(ErrorMessage = ValidationMessages.Required)]
    [EmailAddress(ErrorMessage = ValidationMessages.Email)]
    public string ReporterEmail { get; set; } = "";


    // Company

    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(200, ErrorMessage = ValidationMessages.MaxLength)]
    public string CompanyName { get; set; } = "";

    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(200, ErrorMessage = ValidationMessages.MaxLength)]
    public string CompanyAddress { get; set; } = "";

    [Required(ErrorMessage = ValidationMessages.Required)]
    [RegularExpression(
        @"^\d{2}-\d{3}$",
        ErrorMessage = "Kod pocztowy musi mieć format XX-XXX."
    )]
    public string CompanyPostalCode { get; set; } = "";

    [Required(ErrorMessage = ValidationMessages.Required)]
    [MaxLength(100, ErrorMessage = ValidationMessages.MaxLength)]
    public string CompanyCity { get; set; } = "";

    [Required(ErrorMessage = ValidationMessages.Required)]
    [RegularExpression(
        @"^\d{10}$",
        ErrorMessage = "NIP musi składać się z 10 cyfr."
    )]
    public string CompanyNip { get; set; } = "";


    // Warranty

    public bool HasWarranty { get; set; }

    public DateOnly? PurchaseDate { get; set; }

    [MaxLength(100, ErrorMessage = ValidationMessages.MaxLength)]
    public string? PurchaseInvoiceNumber { get; set; }


    // Contract

    public bool HasContract { get; set; }

    [MaxLength(100, ErrorMessage = ValidationMessages.MaxLength)]
    public string? ContractNumber { get; set; }
}
