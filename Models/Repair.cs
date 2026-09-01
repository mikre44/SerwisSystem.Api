namespace SerwisSystem.Api.Models;

public class Repair
{
    public int Id { get; set; }

    public string Product { get; set; } = "";

    public string SerialNumber { get; set; } = "";

    public string Description { get; set; } = "";

    public string Status { get; set; } = "New";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}