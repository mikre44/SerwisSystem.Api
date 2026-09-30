using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SerwisSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRepairData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NIP",
                table: "Repairs");

            migrationBuilder.RenameColumn(
                name: "Surname",
                table: "Repairs",
                newName: "ReporterSurname");

            migrationBuilder.RenameColumn(
                name: "PhoneNumber",
                table: "Repairs",
                newName: "ReporterPhone");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Repairs",
                newName: "ReporterName");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "Repairs",
                newName: "ReporterEmail");

            migrationBuilder.RenameColumn(
                name: "Address",
                table: "Repairs",
                newName: "CompanyPostalCode");

            migrationBuilder.AddColumn<string>(
                name: "CompanyAddress",
                table: "Repairs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyCity",
                table: "Repairs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "Repairs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyNip",
                table: "Repairs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyPhone",
                table: "Repairs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ContractNumber",
                table: "Repairs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasContract",
                table: "Repairs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasWarranty",
                table: "Repairs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "MarketingConsent",
                table: "Repairs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ProductCategory",
                table: "Repairs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "PurchaseDate",
                table: "Repairs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PurchaseInvoiceNumber",
                table: "Repairs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ServiceDataConsent",
                table: "Repairs",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompanyAddress",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "CompanyCity",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "CompanyName",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "CompanyNip",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "CompanyPhone",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "HasContract",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "HasWarranty",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "MarketingConsent",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "ProductCategory",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "PurchaseDate",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "PurchaseInvoiceNumber",
                table: "Repairs");

            migrationBuilder.DropColumn(
                name: "ServiceDataConsent",
                table: "Repairs");

            migrationBuilder.RenameColumn(
                name: "ReporterSurname",
                table: "Repairs",
                newName: "Surname");

            migrationBuilder.RenameColumn(
                name: "ReporterPhone",
                table: "Repairs",
                newName: "PhoneNumber");

            migrationBuilder.RenameColumn(
                name: "ReporterName",
                table: "Repairs",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "ReporterEmail",
                table: "Repairs",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "CompanyPostalCode",
                table: "Repairs",
                newName: "Address");

            migrationBuilder.AddColumn<long>(
                name: "NIP",
                table: "Repairs",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }
    }
}
