using SerwisSystem.Api.Models;

namespace SerwisSystem.Api.Services;

public static class UserIdentity
{
    public static string Normalize(string value) => value.Trim().ToUpperInvariant();

    public static void Apply(User user, string username, string email)
    {
        user.Username = username.Trim();
        user.Email = email.Trim();
        user.NormalizedUsername = Normalize(username);
        user.NormalizedEmail = Normalize(email);
    }
}
