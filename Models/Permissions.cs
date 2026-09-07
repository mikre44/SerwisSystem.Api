using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Models;

public class Permissions
{
    public int Id { get; set; }

    public int? UserId { get; set; }

    public User? User { get; set; } = null;

    public bool ReadRepairs { get; set; } = false;

    public bool TakeRepairs { get; set; } = false;

    public bool EditRepairs { get; set; } = false;

    public bool DeleteRepairs { get; set; } = false;

    public bool ReadUsers { get; set; } = false;

    public bool EditUsers { get; set; } = false;

    public bool DeleteUsers { get; set; } = false;

    public bool GrantUsers { get; set; } = false;

    public bool DischargeUsers { get; set; } = false;

}