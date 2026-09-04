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
    public DbSet<User> Users => Set<User>();

    public DbSet<Permissions> Permissions => Set<Permissions>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Repair>()// relationship 1:N user to repairs 
            .HasOne(r => r.User)
            .WithMany(u => u.Repairs)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Permissions>()
            .HasOne(p => p.User)
            .WithOne(u => u.Permissions)
            .HasForeignKey<Permissions>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Permissions>()
            .HasIndex(p => p.UserId)
            .IsUnique();

    }


}


