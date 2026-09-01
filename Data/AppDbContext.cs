using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Models;

namespace SerwisSystem.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Repair> Repairs => Set<Repair>();
}