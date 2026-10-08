using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.DTOs;

namespace SerwisSystem.Api.Services;

public static class RepairResponseMapper
{
    // Converts Repair entity to RepairResponseDto
    public static RepairResponseDto CreateResponse(Repair repair, string? workerUsername)
    {
        var repairResponse = new RepairResponseDto
        {
            Id = repair.Id,
            Version = repair.Version,

            Status = repair.Status,

            Product = repair.Product,
            IsCustomProduct = repair.IsCustomProduct,
            SerialNumber = repair.SerialNumber,
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

            CreatedAt = repair.CreatedAt
        };

        repairResponse.WorkerUsername = repair.UserId == null ? null : workerUsername;
        return repairResponse;
    }

}
