using System.Security.Cryptography;
using System.Text;

namespace SerwisSystem.Api.Services;

public static class RepairTracking
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public static string GenerateCode() => new(Enumerable.Range(0, 8)
        .Select(_ => Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)]).ToArray());

    public static string HashCode(string code) => Convert.ToHexString(
        SHA256.HashData(Encoding.UTF8.GetBytes(code.Trim().ToUpperInvariant())));
}
