using SerwisSystem.Api.Services;

namespace SerwisSystem.Api.Tests.Unit;

// Plain unit tests: ProductCatalog is a static class, so no database or web server is needed.
public class ProductCatalogTests
{
    private const string Titan = "Monitor interaktywny myBoard Titan (Android 15)";          // new format, model 05
    private const string GreyArrow = "Monitor interaktywny myBoard Grey Arrow (Android 13)"; // old format, Android 13
    private const string Whiteboard = "Tablica interaktywna myBoard Silver";                 // generic format
    private const string Furniture = "Meble";                                                // no serial number

    [Theory]
    [InlineData(Titan, "L250101056500123")]
    [InlineData(Titan, " L250101059800001 ")] // spaces around are trimmed
    [InlineData(GreyArrow, "202313065123Z")]
    [InlineData(GreyArrow, "202313075999z")]  // the final letter may be lower case
    [InlineData(Whiteboard, "AB-12/3.x_")]
    [InlineData(Whiteboard, "1234")]
    [InlineData(Furniture, null)]
    [InlineData(Furniture, "")]
    public void Valid_serial_numbers_are_accepted(string product, string? serialNumber)
    {
        var error = ProductCatalog.ValidateSerialNumber(product, serialNumber);

        Assert.Null(error);
    }

    [Theory]
    [InlineData(Titan, "l250101056500123")]  // the letter L must be upper case
    [InlineData(Titan, "L250101055000123")]  // 50" is not an allowed screen size
    [InlineData(Titan, "L25010105650012")]   // one digit too short
    [InlineData(GreyArrow, "202313065123")]  // missing Z at the end
    [InlineData(GreyArrow, "L250101056500123")] // new format for an old-format monitor
    [InlineData(Whiteboard, "abc")]          // shorter than 4 characters
    [InlineData(Whiteboard, "AB 123")]       // spaces are not allowed
    public void Serial_numbers_in_a_wrong_format_are_rejected(string product, string serialNumber)
    {
        var error = ProductCatalog.ValidateSerialNumber(product, serialNumber);

        Assert.Equal(
            product == Whiteboard
                ? "Numer seryjny musi mieć od 4 do 40 dozwolonych znaków."
                : "Numer seryjny ma nieprawidłowy format dla wybranego monitora.",
            error);
    }

    [Fact]
    public void Generic_serial_number_longer_than_40_characters_is_rejected()
    {
        var error = ProductCatalog.ValidateSerialNumber(Whiteboard, new string('A', 41));

        Assert.NotNull(error);
    }

    [Theory]
    [InlineData(Titan, null)]
    [InlineData(Titan, "   ")]
    [InlineData(Whiteboard, "")]
    public void Serial_number_is_required_for_monitors_and_boards(string product, string? serialNumber)
    {
        var error = ProductCatalog.ValidateSerialNumber(product, serialNumber);

        Assert.Equal("Numer seryjny jest wymagany dla wybranego produktu.", error);
    }

    [Fact]
    public void Serial_number_of_a_different_monitor_model_is_rejected()
    {
        // Model number 01 is the Black Arrow, not the Titan (05).
        var error = ProductCatalog.ValidateSerialNumber(Titan, "L250101016500123");

        Assert.Equal("Numer seryjny nie odpowiada wybranemu modelowi monitora.", error);
    }

    [Fact]
    public void Serial_number_with_a_different_android_version_is_rejected()
    {
        var error = ProductCatalog.ValidateSerialNumber(GreyArrow, "202311065123Z");

        Assert.Equal("Numer seryjny wskazuje Android 11, a wybrany monitor ma Android 13.", error);
    }

    [Fact]
    public void Only_catalogue_names_are_known_products()
    {
        Assert.True(ProductCatalog.IsKnownProduct(Titan));
        Assert.False(ProductCatalog.IsKnownProduct("Drukarka 3D"));
        Assert.False(ProductCatalog.IsKnownProduct(Titan.ToUpperInvariant()));
    }

    [Fact]
    public void Every_example_serial_number_shown_in_the_form_is_valid()
    {
        // The hints ("np. L250101056500123") are shown to customers, so they must pass the rules themselves.
        var productsWithExamples = ProductCatalog.GetProducts()
            .Where(p => p.SerialHint != null && p.SerialHint.StartsWith("np. "))
            .ToList();

        Assert.NotEmpty(productsWithExamples);

        foreach (var product in productsWithExamples)
        {
            var example = product.SerialHint!["np. ".Length..];

            Assert.Null(ProductCatalog.ValidateSerialNumber(product.Name, example));
        }
    }
}
