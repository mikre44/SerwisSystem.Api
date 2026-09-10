using SerwisSystem.Api.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models;

public class Repair
{
    public int Id { get; set; }

    public string SerialNumber { get; set; } = "";

    public RepairStatus Status { get; set; } = RepairStatus.Pending;

    public string Product { get; set; } = "";

    public int? UserId { get; set; }// Worker in the entire project is defined as User 

    public User? User { get; set; } // Navigation property to the User entity

    public string Description { get; set; } = "";

    public string Name { get; set; } = "";

    public string Surname { get; set; } = "";

    public string PhoneNumber { get; set; } = "";

    public string Email { get; set; } = "";

    public string Address { get; set; } = "";

    
    public long NIP { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}