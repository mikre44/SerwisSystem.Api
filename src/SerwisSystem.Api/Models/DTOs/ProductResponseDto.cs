namespace SerwisSystem.Api.Models.DTOs;

public class ProductResponseDto
{
    public string Name { get; set; } = "";

    public bool SerialRequired { get; set; }

    // Example or description of the expected serial number, null when no serial is required.
    public string? SerialHint { get; set; }
}
