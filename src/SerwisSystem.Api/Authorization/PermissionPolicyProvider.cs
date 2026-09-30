using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Authorization;

public class PermissionPolicyProvider : DefaultAuthorizationPolicyProvider
{
    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options) : base(options)
    {
    }

    public override Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        // policyName comes from [RequirePermission], so it should always be a valid enum name.
        // An unknown name (e.g. a leftover from a rename) returns null instead of silently
        // denying or allowing access, which surfaces the mistake immediately. Enum.TryParse also
        // accepts a plain number (e.g. "3" for DeleteRepairs), so the ToString() check makes sure
        // policyName actually was the permission's name.
        if (!Enum.TryParse<Permission>(policyName, out var permission) ||
            !Enum.IsDefined(permission) ||
            permission.ToString() != policyName)
        {
            return Task.FromResult<AuthorizationPolicy?>(null);
        }

        var policy = new AuthorizationPolicyBuilder()
            .AddRequirements(new PermissionRequirement(permission))
            .Build();

        return Task.FromResult<AuthorizationPolicy?>(policy);
    }
}
