using Microsoft.AspNetCore.Authorization;
using SerwisSystem.Api.Services;

namespace SerwisSystem.Api.Authorization;

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly UserService _userService;
    private readonly PermissionService _permissionService;

    public PermissionHandler(UserService userService, PermissionService permissionService)
    {
        _userService = userService;
        _permissionService = permissionService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // GetCurrentUser caches the user for this request, so the controller action can reuse it.
        var user = await _userService.GetCurrentUser(context.User);

        if (user != null && _permissionService.HasPermission(user, requirement.Permission))
            context.Succeed(requirement);
    }
}