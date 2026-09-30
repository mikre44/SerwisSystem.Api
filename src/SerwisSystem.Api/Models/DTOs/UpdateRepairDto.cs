namespace SerwisSystem.Api.Models.DTOs;

// The edit form changes repair data only. The status is changed through
// take / complete / cancel / return, or by an admin with PUT {id}/status.
public class UpdateRepairDto : RepairDataDto
{
}
