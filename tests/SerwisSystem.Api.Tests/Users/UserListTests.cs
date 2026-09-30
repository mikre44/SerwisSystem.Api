using System.Net;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Models.Enums;
using SerwisSystem.Api.Tests.Infrastructure;

namespace SerwisSystem.Api.Tests.Users;

[Collection(ApiCollection.Name)]
public class UserListTests : ApiTestBase
{
    public UserListTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Sorting_by_priority_lists_the_top_admin_first_and_workers_last()
    {
        // Makes sure there is at least one worker and one admin besides the first admin.
        await CreateWorkerAsync();
        var admin = await LoginAsAdminAsync();
        var promoted = await CreateWorkerAsync();
        await admin.PutAsync($"/api/users/{promoted.Id}/promote-admin", content: null);

        var response = await admin.GetAsync("/api/users?sortBy=priority&pageSize=100");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var page = await response.ReadJsonAsync<PagedResponse<UserResponseDto>>();
        Assert.Equal(ApiFactory.AdminUsername, page.Items[0].Username);

        var admins = page.Items.TakeWhile(u => u.Role == UserRole.Admin).ToList();
        Assert.True(admins.Count >= 2);
        Assert.All(page.Items.Skip(admins.Count), u => Assert.Equal(UserRole.Worker, u.Role));
        Assert.Equal(admins.Select(u => u.Priority).Order(), admins.Select(u => u.Priority));
    }

    [Fact]
    public async Task Unknown_sort_key_returns_400()
    {
        var admin = await LoginAsAdminAsync();

        var response = await admin.GetAsync("/api/users?sortBy=passwordHash");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.ReadProblemAsync();
        Assert.StartsWith("Nieznana wartość sortBy 'passwordHash'.", problem.Detail);
    }
}
