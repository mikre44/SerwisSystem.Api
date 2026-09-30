using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Authorization;

// Builds a policy for every [RequirePermission] attribute. The policy name is the permission's name.
public class PermissionPolicyProvider : DefaultAuthorizationPolicyProvider
{
    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options) : base(options)
    {
    }

    public override Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        // Other names (e.g. policies registered with AddPolicy) are left to the default provider.
        if (!PermissionNames.TryParse(policyName, out var permission))
            return base.GetPolicyAsync(policyName);

        var policy = new AuthorizationPolicyBuilder()
            .AddRequirements(new PermissionRequirement(permission))
            .Build();

        return Task.FromResult<AuthorizationPolicy?>(policy);
    }
}
