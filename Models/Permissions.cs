using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Models;

public class Permissions
{
    public int Id { get; set; }

    public int? UserId { get; set; }

    public User? User { get; set; } = null;

    public bool ReadRepairs { get; set; } = false;

    public bool TakeRepair { get; set; } = false;

    public bool EditRepair { get; set; } = false;

    public bool DeleteRepair { get; set; } = false;

    public bool ReadUsers { get; set; } = false;

    public bool EditUser { get; set; } = false;

    public bool DeleteUser { get; set; } = false;

    public bool GrantUser { get; set; } = false;

}