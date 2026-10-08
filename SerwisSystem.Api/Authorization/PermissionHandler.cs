using Microsoft.AspNetCore.Authorization;
using SerwisSystem.Api.Services;
using System.Security.Claims;

namespace SerwisSystem.Api.Authorization;

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly UserService _userService;
    private readonly PermissionService _permissionService;

    public PermissionHandler(
        UserService userService,
        PermissionService permissionService)
    {
        _userService = userService;
        _permissionService = permissionService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var user = await _userService.GetCurrentUser(
            context.User
        );

        if (user == null)
            return;

        if (_permissionService.HasPermission(
            user,
            requirement.Permission))
        {
            context.Succeed(requirement);
        }
    }
}