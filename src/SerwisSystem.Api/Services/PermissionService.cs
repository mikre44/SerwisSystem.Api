using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Services;

public class PermissionService
{
    public bool HasPermission(User user, string permission)
    {
        // Admins automatically have every permission.
        if (user.Role == UserRole.Admin)
            return true;

        if (user.Permissions == null)
            return false;

        // Permission names are the names of the bool properties of Permissions (e.g. "ReadRepairs"),
        // so reflection reads the property with that name.
        var property = typeof(Permissions).GetProperty(permission);

        if (property == null || property.PropertyType != typeof(bool))
            return false;

        return (bool)property.GetValue(user.Permissions)!;
    }

    // Decides whether currentUser may edit, delete, demote or change the permissions of another user.
    // A lower Priority number means more authority (1 is the top admin), and only an admin with
    // strictly more authority may manage another admin. Admins with the same priority cannot demote
    // or delete each other, and nobody can remove the last (top) admin.
    // Actions on your own account are decided by the controller, not here.
    public bool CanManageTargetUser(User currentUser, User targetUser)
    {
        if (targetUser.Role != UserRole.Admin)
            return true;

        return currentUser.Role == UserRole.Admin && currentUser.Priority < targetUser.Priority;
    }
}
