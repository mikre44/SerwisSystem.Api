using System.ComponentModel.DataAnnotations;
namespace SerwisSystem.Api.Models.DTOs;
public class UpdatePriorityDto
{
    [Range(1, AdminRules.MaximumPriority, ErrorMessage = "Priorytet musi mieścić się w zakresie od 1 do 999.")]
    public int Priority { get; set; }
}
