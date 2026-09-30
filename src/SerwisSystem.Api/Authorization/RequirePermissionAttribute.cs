using Microsoft.AspNetCore.Authorization;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Authorization;

public class RequirePermissionAttribute : AuthorizeAttribute
{
    // The policy name is just the enum member's name (e.g. "EditRepairs").
    // PermissionPolicyProvider parses it back into a Permission with PermissionNames.TryParse.
    public RequirePermissionAttribute(Permission permission)
    {
        Policy = permission.ToString();
    }
}
