using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Models.DTOs;

public class RepairResponseDto
{
    public int Id { get; set; }
    public uint Version { get; set; }

    public RepairStatus Status { get; set; }

    public string Product { get; set; } = "";

    public bool IsCustomProduct { get; set; }

    public string? SerialNumber { get; set; }

    public string Description { get; set; } = "";


    // Reporting person

    public string ReporterName { get; set; } = "";

    public string ReporterSurname { get; set; } = "";

    public string ReporterPhone { get; set; } = "";

    public string ReporterEmail { get; set; } = "";


    // Company

    public string CompanyName { get; set; } = "";

    public string CompanyAddress { get; set; } = "";

    public string CompanyPostalCode { get; set; } = "";

    public string CompanyCity { get; set; } = "";

    public string CompanyNip { get; set; } = "";




    // Warranty

    public bool HasWarranty { get; set; }

    public DateOnly? PurchaseDate { get; set; }

    public string? PurchaseInvoiceNumber { get; set; }


    // Contract

    public bool HasContract { get; set; }

    public string? ContractNumber { get; set; }


    // Consents

    public bool ServiceDataConsent { get; set; }

    public bool MarketingConsent { get; set; }


    // Worker

    public int? WorkerId { get; set; }

    public string? WorkerUsername { get; set; }


    public DateTime CreatedAt { get; set; }
}