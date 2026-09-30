namespace SerwisSystem.Api.Models.DTOs;

// Polish error messages for the data annotations on the DTOs (both apps are Polish-only).
// The frontend shows them next to the field, so they do not repeat the field name.
// {1} is the limit given to the attribute, e.g. 100 in [MaxLength(100)].
public static class ValidationMessages
{
    // Title of every 400 response with field errors. It has no "detail", so the frontend shows the title.
    public const string Title = "Błędne dane.";

    public const string Required = "To pole jest wymagane.";

    public const string MaxLength = "Maksymalnie {1} znaków.";

    public const string MinLength = "Minimum {1} znaków.";

    public const string Email = "Nieprawidłowy adres e-mail.";
}
