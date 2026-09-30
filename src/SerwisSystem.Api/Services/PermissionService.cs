using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Services;

public class PermissionService
{
    public bool HasPermission(User user, Permission permission)
    {
        // Admins automatically have every permission.
        if (user.Role == UserRole.Admin)
            return true;

        return user.Permissions != null && HasPermission(user.Permissions, permission);
    }

    // Maps a Permission to its matching bool column on Permissions. A switch expression keeps
    // this mapping in one place and compile-time checked, instead of looking up a property by name.
    public bool HasPermission(Permissions permissions, Permission permission) => permission switch
    {
        Permission.ReadRepairs => permissions.ReadRepairs,
        Permission.TakeRepairs => permissions.TakeRepairs,
        Permission.EditRepairs => permissions.EditRepairs,
        Permission.DeleteRepairs => permissions.DeleteRepairs,

        Permission.ReadUsers => permissions.ReadUsers,
        Permission.EditUsers => permissions.EditUsers,
        Permission.DeleteUsers => permissions.DeleteUsers,
        Permission.GrantUsers => permissions.GrantUsers,
        Permission.DischargeUsers => permissions.DischargeUsers,

        _ => throw new ArgumentOutOfRangeException(nameof(permission), permission, "Unknown permission.")
    };

    // The other half of the same mapping, used by UsersController.GrantUser to grant/revoke.
    public void SetPermission(Permissions permissions, Permission permission, bool value)
    {
        switch (permission)
        {
            case Permission.ReadRepairs: permissions.ReadRepairs = value; break;
            case Permission.TakeRepairs: permissions.TakeRepairs = value; break;
            case Permission.EditRepairs: permissions.EditRepairs = value; break;
            case Permission.DeleteRepairs: permissions.DeleteRepairs = value; break;

            case Permission.ReadUsers: permissions.ReadUsers = value; break;
            case Permission.EditUsers: permissions.EditUsers = value; break;
            case Permission.DeleteUsers: permissions.DeleteUsers = value; break;
            case Permission.GrantUsers: permissions.GrantUsers = value; break;
            case Permission.DischargeUsers: permissions.DischargeUsers = value; break;

            default: throw new ArgumentOutOfRangeException(nameof(permission), permission, "Unknown permission.");
        }
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
