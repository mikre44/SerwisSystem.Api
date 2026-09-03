using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SerwisSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkerToRepair : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WorkerId",
                table: "Repairs");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Repairs",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Repairs_UserId",
                table: "Repairs",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Repairs_Users_UserId",
                table: "Repairs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Repairs_Users_UserId",
                table: "Repairs");

            migrationBuilder.DropIndex(
                name: "IX_Repairs_UserId",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Repairs");

            migrationBuilder.AddColumn<int>(
                name: "WorkerId",
                table: "Repairs",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
