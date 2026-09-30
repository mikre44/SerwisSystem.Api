using Microsoft.AspNetCore.Authorization;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Authorization;

public class PermissionRequirement : IAuthorizationRequirement
{
    public Permission Permission { get; }

    public PermissionRequirement(Permission permission)
    {
        Permission = permission;
    }
}
