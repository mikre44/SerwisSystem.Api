using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SerwisSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTrackingAndAccountProtection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NormalizedEmail",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NormalizedUsername",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "SessionVersion",
                table: "Users",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "TrackingCodeHash",
                table: "Repairs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrackingSerialNumber",
                table: "Repairs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Repairs",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.CreateTable(
                name: "InitialSetups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InitialSetups", x => x.Id);
                });

            migrationBuilder.Sql("""
                UPDATE "Users" SET "NormalizedUsername" = upper(trim("Username")),
                    "NormalizedEmail" = upper(trim("Email")), "SessionVersion" = gen_random_uuid();
                UPDATE "Repairs" SET "TrackingSerialNumber" = trim("SerialNumber");
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Users_NormalizedEmail",
                table: "Users",
                column: "NormalizedEmail",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_NormalizedUsername",
                table: "Users",
                column: "NormalizedUsername",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_RolePriority",
                table: "Users",
                sql: "(\"Role\" = 0 AND \"Priority\" = 0) OR (\"Role\" = 1 AND \"Priority\" BETWEEN 1 AND 999)");

            migrationBuilder.CreateIndex(
                name: "IX_Repairs_TrackingCodeHash",
                table: "Repairs",
                column: "TrackingCodeHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InitialSetups");

            migrationBuilder.DropIndex(
                name: "IX_Users_NormalizedEmail",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_NormalizedUsername",
                table: "Users");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_RolePriority",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Repairs_TrackingCodeHash",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "NormalizedEmail",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "NormalizedUsername",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SessionVersion",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TrackingCodeHash",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "TrackingSerialNumber",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Repairs");
        }
    }
}
