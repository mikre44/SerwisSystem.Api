using System.Text.Json.Serialization;
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

    // Only the profile endpoints load the repairs. Elsewhere the field is left out of the JSON,
    // so "no repairs loaded" cannot be mistaken for "the user has no repairs".
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<RepairResponseDto>? Repairs { get; set; }
}
