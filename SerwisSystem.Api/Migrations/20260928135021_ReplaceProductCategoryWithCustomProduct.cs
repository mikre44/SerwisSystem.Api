using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SerwisSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceProductCategoryWithCustomProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProductCategory",
                table: "Repairs");

            migrationBuilder.AlterColumn<string>(
                name: "Product",
                table: "Repairs",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCustomProduct",
                table: "Repairs",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCustomProduct",
                table: "Repairs");

            migrationBuilder.AlterColumn<string>(
                name: "Product",
                table: "Repairs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "ProductCategory",
                table: "Repairs",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
