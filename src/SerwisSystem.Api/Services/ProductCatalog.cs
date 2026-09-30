using System.Text.RegularExpressions;
using SerwisSystem.Api.Models.DTOs;

namespace SerwisSystem.Api.Services;

// The single list of products and their serial number rules.
// Both React apps load it from GET /api/products, and the API uses it
// to validate new and edited repairs, so the rules cannot drift apart.
public static class ProductCatalog
{
    private enum SerialFormat
    {
        None,     // no serial number required
        New,      // e.g. L250101056500123
        Old,      // e.g. 202313065123Z
        Generic   // 4-40 letters, digits or . _ / -
    }

    // ExpectedNumber is the model number (new format)
    // or the Android version (old format) encoded in the serial number.
    private record Product(
        string Name,
        SerialFormat SerialFormat = SerialFormat.None,
        string? ExpectedNumber = null);

    // The order here is the order shown in the product drop-down.
    private static readonly List<Product> Products =
    [
        new("Monitor interaktywny myBoard Titan (Android 15)", SerialFormat.New, "05"),
        new("Monitor interaktywny myBoard Grey Arrow (Android 13)", SerialFormat.Old, "13"),
        new("Monitor interaktywny myBoard Panda (Android 13)", SerialFormat.New, "02"),
        new("Monitor interaktywny myBoard Black Arrow (Android 13)", SerialFormat.New, "01"),
        new("Monitor interaktywny myBoard Grey Rock (Android 11)", SerialFormat.Old, "11"),
        new("Monitor interaktywny myBoard Grey Rock 2.0 (Android 11)", SerialFormat.Old, "11"),
        new("Monitor interaktywny myBoard White Arrow (Android 14)", SerialFormat.New, "04"),
        new("Monitor interaktywny myBoard Panda 2.0 (Android 14)", SerialFormat.New, "03"),
        new("Monitor interaktywny (model spoza listy)", SerialFormat.Generic),
        new("Tablica interaktywna myBoard Silver", SerialFormat.Generic),
        new("Tablica interaktywna myBoard Black", SerialFormat.Generic),

        new("Akcesoria do tablic interaktywnych myBoard"),
        new("Akcesoria dla monitorów interaktywnych myBoard"),
        new("Pracownie językowe"),
        new("Podłoga interaktywna SmartFloor"),
        new("Meble"),
        new("Systemy konferencyjne"),
        new("Projektory"),
        new("Laptop"),
    ];

    // ECMAScript makes \d match only 0-9, exactly like in JavaScript.
    private static readonly Regex NewSerial = new(
        @"^L(\d{6})(\d{2})(55|65|75|86|98)(\d{5})$",
        RegexOptions.ECMAScript);

    private static readonly Regex OldSerial = new(
        @"^(\d{4})(8|11|13)\d(55|65|75|86|98)(\d{3})z$",
        RegexOptions.ECMAScript | RegexOptions.IgnoreCase);

    private static readonly Regex GenericSerial = new(
        @"^[A-Za-z0-9._/-]{4,40}$",
        RegexOptions.ECMAScript);


    public static List<ProductResponseDto> GetProducts()
    {
        return Products
            .Select(p => new ProductResponseDto
            {
                Name = p.Name,
                SerialRequired = p.SerialFormat != SerialFormat.None,
                SerialHint = GetSerialHint(p)
            })
            .ToList();
    }

    public static bool IsKnownProduct(string name)
    {
        return FindProduct(name) != null;
    }

    // Returns an error message (in Polish, shown in the form),
    // or null when the serial number is valid for the product.
    public static string? ValidateSerialNumber(string productName, string? serialNumber)
    {
        var product = FindProduct(productName);

        if (product == null || product.SerialFormat == SerialFormat.None)
            return null;

        var serial = serialNumber?.Trim() ?? "";

        if (serial == "")
            return "Numer seryjny jest wymagany dla wybranego produktu.";

        switch (product.SerialFormat)
        {
            case SerialFormat.New:
            {
                var match = NewSerial.Match(serial);

                if (!match.Success)
                    return "Numer seryjny ma nieprawidłowy format dla wybranego monitora.";

                var modelNumber = match.Groups[2].Value;

                if (modelNumber != product.ExpectedNumber)
                    return "Numer seryjny nie odpowiada wybranemu modelowi monitora.";

                return null;
            }

            case SerialFormat.Old:
            {
                var match = OldSerial.Match(serial);

                if (!match.Success)
                    return "Numer seryjny ma nieprawidłowy format dla wybranego monitora.";

                var androidVersion = match.Groups[2].Value;

                if (androidVersion != product.ExpectedNumber)
                {
                    return $"Numer seryjny wskazuje Android {androidVersion}, " +
                           $"a wybrany monitor ma Android {product.ExpectedNumber}.";
                }

                return null;
            }

            case SerialFormat.Generic:
                return GenericSerial.IsMatch(serial)
                    ? null
                    : "Numer seryjny musi mieć od 4 do 40 dozwolonych znaków.";

            default:
                return "Nie można zweryfikować numeru seryjnego.";
        }
    }


    private static Product? FindProduct(string name)
    {
        return Products.FirstOrDefault(p => p.Name == name);
    }

    private static string? GetSerialHint(Product product)
    {
        return product.SerialFormat switch
        {
            SerialFormat.New => $"np. L250101{product.ExpectedNumber}6500123",
            SerialFormat.Old => $"np. 2023{product.ExpectedNumber}065123Z",
            SerialFormat.Generic => "od 4 do 40 znaków: litery, cyfry oraz . _ / -",
            _ => null
        };
    }
}
