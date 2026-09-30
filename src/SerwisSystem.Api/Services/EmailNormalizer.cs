namespace SerwisSystem.Api.Services;

// People type the same address in different letter case (Jan@Example.com, jan@example.com),
// so emails of users and repair reporters are stored and compared in one form.
public static class EmailNormalizer
{
    public static string Normalize(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}
