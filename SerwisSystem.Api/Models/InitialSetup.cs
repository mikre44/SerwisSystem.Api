namespace SerwisSystem.Api.Models;

public class InitialSetup
{
    public int Id { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}
