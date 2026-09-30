using System.ComponentModel.DataAnnotations;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Models.DTOs;

public class UpdateRepairStatusDto
{
    // Nullable on purpose: [Required] on a plain enum never fails,
    // because a missing value silently becomes the first member (Pending).
    [Required]
    public RepairStatus? Status { get; set; }
}
