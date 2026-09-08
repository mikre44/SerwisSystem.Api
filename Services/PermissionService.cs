using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Services;

public class PermissionService
{
    public bool HasPermission(User user, string permission)
    {
        // Admins automatically have every permission
        if (user.Role == UserRole.Admin)
            return true;

        if (user.Permissions == null)
            return false;

        var property = typeof(Permissions).GetProperty(permission);// the type of this variable is called ProperyInfo, its value is the other variable itself (Permissions.ReadRepairs for example), kinda crazy to me tbh

        if (property == null || property.PropertyType != typeof(bool))// checks if ist a bool cuz all of the permission variables are boolean
            return false;

        return (bool)property.GetValue(user.Permissions)!;
    }

    public bool CanManageTargetUser(User currentUser, User targetUser)
    {
        if (currentUser.Id == targetUser.Id)
            return true;

        if (targetUser.Role == UserRole.Admin)
        {
            if (currentUser.Role != UserRole.Admin)
                return false;

            return currentUser.Priority <= targetUser.Priority;// "lower" priority number means higher priority, number 1 will be the highest(for now at least)

        }
        return true;
    }
}