using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Models;

public class User
{
    public int Id { get; set; }

    public string Username { get; set; } = "";

    public string PasswordHash { get; set; } = "";

    public string Email { get; set; } = "";

    public UserRole Role { get; set; } = UserRole.Worker;

    public int Priority { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Repair> Repairs { get; set; } = new List<Repair>();
}