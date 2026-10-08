using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
namespace SerwisSystem.Api.Services;
public static class RepairValidation
{
    private static readonly Dictionary<string, (string Format, string? Model)> SerialRules = new()
    {
        ["Monitor interaktywny myBoard Titan (Android 15)"] = ("new", "05"),
        ["Monitor interaktywny myBoard Grey Arrow (Android 13)"] = ("old", "13"),
        ["Monitor interaktywny myBoard Panda (Android 13)"] = ("new", "02"),
        ["Monitor interaktywny myBoard Black Arrow (Android 13)"] = ("new", "01"),
        ["Monitor interaktywny myBoard Grey Rock (Android 11)"] = ("old", "11"),
        ["Monitor interaktywny myBoard Grey Rock 2.0 (Android 11)"] = ("old", "11"),
        ["Monitor interaktywny myBoard White Arrow (Android 14)"] = ("new", "04"),
        ["Monitor interaktywny myBoard Panda 2.0 (Android 14)"] = ("new", "03"),
        ["Monitor interaktywny (model spoza listy)"] = ("generic", null),
        ["Tablica interaktywna myBoard Silver"] = ("generic", null),
        ["Tablica interaktywna myBoard Black"] = ("generic", null),
    };
    public static IEnumerable<ValidationResult> Validate(string product, bool isCustomProduct, string? serialNumber,
        string companyNip, bool hasWarranty, DateOnly? purchaseDate, bool strictSerialValidation)
    {
        var digits = companyNip ?? "";
        int[] weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
        if (digits.Length == 10 && digits.All(char.IsAsciiDigit)
            && weights.Select((weight, index) => weight * (digits[index] - '0')).Sum() % 11 != digits[9] - '0')
            yield return new ValidationResult("Podany NIP jest nieprawidłowy.", ["CompanyNip"]);
        if (hasWarranty && purchaseDate > DateOnly.FromDateTime(DateTime.UtcNow))
            yield return new ValidationResult("Data zakupu nie może być datą przyszłą.", ["PurchaseDate"]);
        if (!isCustomProduct && SerialRules.TryGetValue(product, out var rule))
        {
            if (string.IsNullOrWhiteSpace(serialNumber))
                yield return new ValidationResult("Numer seryjny jest wymagany dla tego produktu.", ["SerialNumber"]);
            else if (strictSerialValidation)
            {
                var serial = serialNumber.Trim();
                var match = rule.Format switch
                {
                    "new" => Regex.Match(serial, @"^L(\d{6})(\d{2})(55|65|75|86|98)(\d{5})$"),
                    "old" => Regex.Match(serial, @"^(\d{4})(8|11|13)\d(55|65|75|86|98)(\d{3})Z$", RegexOptions.IgnoreCase),
                    _ => Regex.Match(serial, @"^[A-Za-z0-9._/-]{4,40}$")
                };
                if (!match.Success || (rule.Model != null && match.Groups[2].Value != rule.Model))
                    yield return new ValidationResult("Numer seryjny nie odpowiada wybranemu produktowi.", ["SerialNumber"]);
            }
        }
    }
}
