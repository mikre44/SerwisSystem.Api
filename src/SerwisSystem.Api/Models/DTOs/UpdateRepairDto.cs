using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Models.DTOs;

public class UpdateRepairDto : RepairDataDto
{
    public RepairStatus? Status { get; set; }
}
