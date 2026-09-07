using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Models.DTOs;

public class RepairDto
{
    public int Id { get; set; }

    public int SerialNumber { get; set; }

    public RepairStatus Status { get; set; }

    public string Product { get; set; } = "";

    public string Description { get; set; } = "";

    public string Name { get; set; } = "";

    public string Surname { get; set; } = "";

    public string PhoneNumber { get; set; } = "";

    public string Email { get; set; } = "";

    public string Address { get; set; } = "";

    public int NIP { get; set; }

    public int? UserId { get; set; }
}