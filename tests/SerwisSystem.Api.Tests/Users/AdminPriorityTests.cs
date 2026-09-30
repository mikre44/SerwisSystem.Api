using System.Net;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Models.Enums;
using SerwisSystem.Api.Tests.Infrastructure;

namespace SerwisSystem.Api.Tests.Users;

// A lower Priority number means more authority (the first admin has 1).
// An admin can manage only admins with strictly less authority.
[Collection(ApiCollection.Name)]
public class AdminPriorityTests : ApiTestBase
{
    public AdminPriorityTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Admins_with_the_same_priority_cannot_demote_each_other()
    {
        var firstAdmin = await CreatePromotedAdminAsync();
        var secondAdmin = await CreatePromotedAdminAsync();

        var response = await firstAdmin.Client.PutAsync($"/api/users/{secondAdmin.Id}/demote-admin", content: null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admins_with_the_same_priority_cannot_delete_each_other()
    {
        var firstAdmin = await CreatePromotedAdminAsync();
        var secondAdmin = await CreatePromotedAdminAsync();

        var response = await firstAdmin.Client.DeleteAsync($"/api/users/{secondAdmin.Id}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_with_more_authority_can_demote_another_admin()
    {
        var promotedAdmin = await CreatePromotedAdminAsync();
        var topAdmin = await LoginAsAdminAsync();

        var response = await topAdmin.PutAsync($"/api/users/{promotedAdmin.Id}/demote-admin", content: null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var demoted = await response.ReadJsonAsync<UserResponseDto>();
        Assert.Equal(UserRole.Worker, demoted.Role);
    }

    [Fact]
    public async Task Admin_cannot_delete_their_own_account()
    {
        var admin = await LoginAsAdminAsync();
        var me = await (await admin.GetAsync("/api/users/logged")).ReadJsonAsync<UserResponseDto>();

        var response = await admin.DeleteAsync($"/api/users/{me.Id}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.ReadProblemAsync();
        Assert.Equal("Nie możesz usunąć własnego konta.", problem.Detail);
    }

    // The first admin (priority 1) promotes a new worker, who gets priority 2.
    // Two admins created this way have the same priority.
    private async Task<TestUser> CreatePromotedAdminAsync()
    {
        var worker = await CreateWorkerAsync();
        var topAdmin = await LoginAsAdminAsync();

        var response = await topAdmin.PutAsync($"/api/users/{worker.Id}/promote-admin", content: null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var promoted = await response.ReadJsonAsync<UserResponseDto>();
        Assert.Equal(2, promoted.Priority);

        return worker;
    }
}
