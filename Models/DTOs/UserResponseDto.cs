using SerwisSystem.Api.Models.Enums;
namespace SerwisSystem.Api.Models.DTOs;

public class UserResponseDto
{
    public int Id { get; set; }

    public string Username { get; set; } = "";

    public string Email { get; set; } = "";

    public UserRole Role { get; set; }

    public int Priority { get; set; }

    public DateTime CreatedAt { get; set; }

    public PermissionsResponseDto? Permissions { get; set; }
    public List<RepairResponseDto> Repairs { get; set; } = new();
}