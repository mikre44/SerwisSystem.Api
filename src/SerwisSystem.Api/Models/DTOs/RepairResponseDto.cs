using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Models.DTOs;

public class RepairResponseDto
{
    public int Id { get; set; }

    public RepairStatus Status { get; set; }

    public string Product { get; set; } = "";

    public bool IsCustomProduct { get; set; }

    // Null when the repair has no serial number, like in PublicRepairResponseDto.
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

    // Filled only when the worker (Repair.User) was loaded with the repair.
    public string? WorkerUsername { get; set; }


    public DateTime CreatedAt { get; set; }


    // The only place that maps a Repair to the response,
    // so every endpoint returns the same shape.
    public static RepairResponseDto FromEntity(Repair repair)
    {
        return new RepairResponseDto
        {
            Id = repair.Id,
            Status = repair.Status,

            Product = repair.Product,
            IsCustomProduct = repair.IsCustomProduct,
            SerialNumber = string.IsNullOrEmpty(repair.SerialNumber)
                ? null
                : repair.SerialNumber,
            Description = repair.Description,

            ReporterName = repair.ReporterName,
            ReporterSurname = repair.ReporterSurname,
            ReporterPhone = repair.ReporterPhone,
            ReporterEmail = repair.ReporterEmail,

            CompanyName = repair.CompanyName,
            CompanyAddress = repair.CompanyAddress,
            CompanyPostalCode = repair.CompanyPostalCode,
            CompanyCity = repair.CompanyCity,
            CompanyNip = repair.CompanyNip,

            HasWarranty = repair.HasWarranty,
            PurchaseDate = repair.PurchaseDate,
            PurchaseInvoiceNumber = repair.PurchaseInvoiceNumber,

            HasContract = repair.HasContract,
            ContractNumber = repair.ContractNumber,

            ServiceDataConsent = repair.ServiceDataConsent,
            MarketingConsent = repair.MarketingConsent,

            WorkerId = repair.UserId,
            WorkerUsername = repair.User?.Username,

            CreatedAt = repair.CreatedAt
        };
    }
}
