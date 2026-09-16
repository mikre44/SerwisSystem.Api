using SerwisSystem.Api.Models.Enums;

public class RepairResponseDto
{
    public int Id { get; set; }
    public string SerialNumber { get; set; }
    public RepairStatus Status { get; set; }

    public int? WorkerId { get; set; }
    public string? WorkerUsername { get; set; }

    public string Product { get; set; } = "";
    public string Description { get; set; } = "";
    public string Name { get; set; } = "";
    public string Surname { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string Address { get; set; } = "";
    public string Email { get; set; } = "";
    public long NIP { get; set; }

    public DateTime CreatedAt { get; set; }
}