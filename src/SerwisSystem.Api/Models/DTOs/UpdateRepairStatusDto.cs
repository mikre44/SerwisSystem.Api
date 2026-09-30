using System.ComponentModel.DataAnnotations;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Models.DTOs;

public class UpdateRepairStatusDto
{
    // Nullable on purpose: [Required(ErrorMessage = ValidationMessages.Required)] on a plain enum never fails,
    // because a missing value silently becomes the first member (Pending).
    [Required(ErrorMessage = ValidationMessages.Required)]
    public RepairStatus? Status { get; set; }
}
