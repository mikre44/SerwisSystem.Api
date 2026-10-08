using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Models;

namespace SerwisSystem.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<InitialSetup> InitialSetups => Set<InitialSetup>();

    public DbSet<Repair> Repairs => Set<Repair>();
    public DbSet<User> Users => Set<User>();

    public DbSet<Permissions> Permissions => Set<Permissions>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InitialSetup>().Property(setup => setup.Id).ValueGeneratedNever();
        modelBuilder.Entity<Repair>().Property(repair => repair.Version).IsRowVersion();
        modelBuilder.Entity<Repair>().HasIndex(repair => repair.TrackingCodeHash).IsUnique();
        modelBuilder.Entity<User>().HasIndex(user => user.NormalizedUsername).IsUnique();
        modelBuilder.Entity<User>().HasIndex(user => user.NormalizedEmail).IsUnique();
        modelBuilder.Entity<User>().ToTable("Users", table => table.HasCheckConstraint(
            "CK_Users_RolePriority", "(\"Role\" = 0 AND \"Priority\" = 0) OR (\"Role\" = 1 AND \"Priority\" BETWEEN 1 AND 999)"));
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


