using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Models.DTOs;

// What an anonymous customer may see about a repair:
// no personal data and no worker.
public class PublicRepairResponseDto
{
    public int Id { get; set; }

    public string Product { get; set; } = "";

    // Null when the repair has no serial number.
    public string? SerialNumber { get; set; }

    public RepairStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }


    public static PublicRepairResponseDto FromEntity(Repair repair)
    {
        return new PublicRepairResponseDto
        {
            Id = repair.Id,
            Product = repair.Product,
            SerialNumber = string.IsNullOrEmpty(repair.SerialNumber)
                ? null
                : repair.SerialNumber,
            Status = repair.Status,
            CreatedAt = repair.CreatedAt
        };
    }
}
