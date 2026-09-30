namespace SerwisSystem.Api.Models.DTOs;

public class PublicRepairResponseDto
{
    public string SerialNumber { get; set; }

    public string Product { get; set; } = "";

    public string Status { get; set; } = "";

    public DateTime CreatedAt { get; set; }
}