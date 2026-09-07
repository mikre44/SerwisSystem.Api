using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SerwisSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class PermissionsModelAdjustment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TakeRepair",
                table: "Permissions",
                newName: "TakeRepairs");

            migrationBuilder.RenameColumn(
                name: "GrantUser",
                table: "Permissions",
                newName: "GrantUsers");

            migrationBuilder.RenameColumn(
                name: "EditUser",
                table: "Permissions",
                newName: "EditUsers");

            migrationBuilder.RenameColumn(
                name: "EditRepair",
                table: "Permissions",
                newName: "EditRepairs");

            migrationBuilder.RenameColumn(
                name: "DeleteUser",
                table: "Permissions",
                newName: "DischargeUsers");

            migrationBuilder.RenameColumn(
                name: "DeleteRepair",
                table: "Permissions",
                newName: "DeleteUsers");

            migrationBuilder.AddColumn<bool>(
                name: "DeleteRepairs",
                table: "Permissions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeleteRepairs",
                table: "Permissions");

            migrationBuilder.RenameColumn(
                name: "TakeRepairs",
                table: "Permissions",
                newName: "TakeRepair");

            migrationBuilder.RenameColumn(
                name: "GrantUsers",
                table: "Permissions",
                newName: "GrantUser");

            migrationBuilder.RenameColumn(
                name: "EditUsers",
                table: "Permissions",
                newName: "EditUser");

            migrationBuilder.RenameColumn(
                name: "EditRepairs",
                table: "Permissions",
                newName: "EditRepair");

            migrationBuilder.RenameColumn(
                name: "DischargeUsers",
                table: "Permissions",
                newName: "DeleteUser");

            migrationBuilder.RenameColumn(
                name: "DeleteUsers",
                table: "Permissions",
                newName: "DeleteRepair");
        }
    }
}
