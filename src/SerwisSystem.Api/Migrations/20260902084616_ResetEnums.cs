using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SerwisSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class ResetEnums : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Repairs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Repairs",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
