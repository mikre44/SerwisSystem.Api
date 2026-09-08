using Microsoft.AspNetCore.Authorization;

namespace SerwisSystem.Api.Authorization;

public class RequirePermissionAttribute : AuthorizeAttribute
{
    public RequirePermissionAttribute(string permission)
    {
        Policy = permission;
    }
}