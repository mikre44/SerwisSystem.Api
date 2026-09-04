using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SerwisSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class EditPermissionsNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "GrantUsers",
                table: "Permissions",
                newName: "GrantUser");

            migrationBuilder.RenameColumn(
                name: "EditUsers",
                table: "Permissions",
                newName: "EditUser");

            migrationBuilder.RenameColumn(
                name: "DeleteUsers",
                table: "Permissions",
                newName: "DeleteUser");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "GrantUser",
                table: "Permissions",
                newName: "GrantUsers");

            migrationBuilder.RenameColumn(
                name: "EditUser",
                table: "Permissions",
                newName: "EditUsers");

            migrationBuilder.RenameColumn(
                name: "DeleteUser",
                table: "Permissions",
                newName: "DeleteUsers");
        }
    }
}
