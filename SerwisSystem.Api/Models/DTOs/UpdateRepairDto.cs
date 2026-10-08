using SerwisSystem.Api.Services;
﻿using SerwisSystem.Api.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace SerwisSystem.Api.Models.DTOs;

public class UpdateRepairDto : RepairVersionDto, IValidatableObject
{
    [EnumDataType(typeof(RepairStatus), ErrorMessage = "Nieprawidłowy status naprawy.")]
    public RepairStatus? Status { get; set; }

[Required(ErrorMessage = "To pole jest wymagane.")]
    [MaxLength(200, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string Product { get; set; } = "";

    public bool IsCustomProduct { get; set; }

    [MaxLength(100, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string? SerialNumber { get; set; }

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [MaxLength(1000, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string Description { get; set; } = "";


    // Reporting person

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [MaxLength(100, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string ReporterName { get; set; } = "";

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [MaxLength(100, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string ReporterSurname { get; set; } = "";

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [RegularExpression(
            @"^(\+)?\d{7,15}$",
            ErrorMessage = "Nieprawidłowy numer telefonu."
        )]
    public string ReporterPhone { get; set; } = "";

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [EmailAddress(ErrorMessage = "Nieprawidłowy adres e-mail.")]
    [MaxLength(254, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string ReporterEmail { get; set; } = "";


    // Company

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [MaxLength(200, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string CompanyName { get; set; } = "";

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [MaxLength(200, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string CompanyAddress { get; set; } = "";

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [RegularExpression(
        @"^\d{2}-\d{3}$",
        ErrorMessage = "Kod pocztowy musi mieć format XX-XXX."
    )]
    public string CompanyPostalCode { get; set; } = "";

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [MaxLength(100, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string CompanyCity { get; set; } = "";

    [Required(ErrorMessage = "To pole jest wymagane.")]
    [RegularExpression(
        @"^\d{10}$",
        ErrorMessage = "NIP musi zawierać dokładnie 10 cyfr."
    )]
    public string CompanyNip { get; set; } = "";


    // Warranty

    public bool HasWarranty { get; set; }

    public DateOnly? PurchaseDate { get; set; }

    [MaxLength(100, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string? PurchaseInvoiceNumber { get; set; }


    // Contract

    public bool HasContract { get; set; }

    [MaxLength(100, ErrorMessage = "Maksymalna liczba znaków: {1}.")]
    public string? ContractNumber { get; set; }
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext) =>
        RepairValidation.Validate(Product, IsCustomProduct, SerialNumber, CompanyNip, HasWarranty, PurchaseDate, false);
}