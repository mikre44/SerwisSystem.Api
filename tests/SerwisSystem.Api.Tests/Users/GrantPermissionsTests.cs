using System.Net;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Tests.Infrastructure;

namespace SerwisSystem.Api.Tests.Users;

// PUT api/users/grant/{id}: you can only give or take away permissions you have yourself.
[Collection(ApiCollection.Name)]
public class GrantPermissionsTests : ApiTestBase
{
    public GrantPermissionsTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Unchanged_permissions_in_the_request_do_not_need_the_granters_rights()
    {
        var granter = await CreateWorkerAsync("GrantUsers", "ReadRepairs");
        var target = await CreateWorkerAsync("DeleteUsers");

        // The target already has DeleteUsers and does not have EditUsers, so only ReadRepairs changes.
        var response = await granter.Client.PutJsonAsync($"/api/users/grant/{target.Id}", new UpdatePermissionsDto
        {
            PermissionsGranted = ["ReadRepairs", "DeleteUsers"],
            PermissionsRevoked = ["EditUsers"]
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.ReadJsonAsync<UserResponseDto>();
        Assert.True(updated.Permissions!.ReadRepairs);
        Assert.True(updated.Permissions.DeleteUsers);
        Assert.False(updated.Permissions.EditUsers);
    }

    [Fact]
    public async Task Changing_a_permission_the_granter_does_not_have_returns_403()
    {
        var granter = await CreateWorkerAsync("GrantUsers", "ReadRepairs");
        var target = await CreateWorkerAsync();

        var response = await granter.Client.PutJsonAsync($"/api/users/grant/{target.Id}", new UpdatePermissionsDto
        {
            PermissionsGranted = ["ReadRepairs", "DeleteUsers"]
        });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var problem = await response.ReadProblemAsync();
        Assert.Contains("„Usuwanie użytkowników”", problem.Detail);

        // Nothing was saved, not even the permission the granter was allowed to give.
        var admin = await LoginAsAdminAsync();
        var user = await (await admin.GetAsync($"/api/users/{target.Id}")).ReadJsonAsync<UserResponseDto>();
        Assert.False(user.Permissions!.ReadRepairs);
    }
}
