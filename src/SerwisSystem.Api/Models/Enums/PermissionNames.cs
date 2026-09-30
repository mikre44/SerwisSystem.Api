namespace SerwisSystem.Api.Models.Enums;

// Converts permission names (from [RequirePermission] policies and from the frontend) to Permission values,
// and gives each permission the Polish label used in error messages.
public static class PermissionNames
{
    // The same labels as the permission toggles in the staff app.
    public static string DisplayName(Permission permission) => permission switch
    {
        Permission.ReadRepairs => "Odczyt napraw",
        Permission.TakeRepairs => "Przyjmowanie napraw",
        Permission.EditRepairs => "Edycja napraw",
        Permission.DeleteRepairs => "Usuwanie napraw",

        Permission.ReadUsers => "Odczyt użytkowników",
        Permission.EditUsers => "Edycja użytkowników",
        Permission.DeleteUsers => "Usuwanie użytkowników",
        Permission.GrantUsers => "Nadawanie uprawnień",
        Permission.DischargeUsers => "Odbieranie uprawnień",

        _ => permission.ToString()
    };

    // Accepts only an exact member name, e.g. "ReadRepairs". Enum.TryParse on its own
    // would also accept numbers such as "3" or "42", so the name is checked first.
    public static bool TryParse(string name, out Permission permission)
    {
        permission = default;
        return Enum.GetNames<Permission>().Contains(name) && Enum.TryParse(name, out permission);
    }
}
