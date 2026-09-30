namespace SerwisSystem.Api.Authorization;

// Bound from the "Jwt" configuration section. Issuer and Audience live in appsettings.json;
// the Key is a secret and comes from user-secrets (development) or the Jwt__Key environment variable.
public class JwtOptions
{
    public const string SectionName = "Jwt";

    // HMAC-SHA256 needs a key of at least 256 bits.
    public const int MinKeyLength = 32;

    public string Key { get; set; } = "";

    public string Issuer { get; set; } = "";

    public string Audience { get; set; } = "";
}
