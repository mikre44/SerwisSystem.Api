namespace SerwisSystem.Api.Models.Enums;

// Converts permission names (from [RequirePermission] policies and from the frontend) to Permission values.
public static class PermissionNames
{
    // Accepts only an exact member name, e.g. "ReadRepairs". Enum.TryParse on its own
    // would also accept numbers such as "3" or "42", so the name is checked first.
    public static bool TryParse(string name, out Permission permission)
    {
        permission = default;
        return Enum.GetNames<Permission>().Contains(name) && Enum.TryParse(name, out permission);
    }
}
