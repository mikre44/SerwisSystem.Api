namespace SerwisSystem.Api.Models.DTOs;

public class CreateRepairDto : RepairDataDto
{
    // Consents are given once, when the customer reports the repair.

    public bool ServiceDataConsent { get; set; }

    public bool MarketingConsent { get; set; }
}
