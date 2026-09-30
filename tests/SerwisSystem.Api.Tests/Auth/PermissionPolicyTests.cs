using System.Net;
using SerwisSystem.Api.Tests.Infrastructure;

namespace SerwisSystem.Api.Tests.Auth;

// GET api/repairs is protected with [RequirePermission("ReadRepairs")].
[Collection(ApiCollection.Name)]
public class PermissionPolicyTests : ApiTestBase
{
    public PermissionPolicyTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Request_without_a_token_returns_401_problem_details()
    {
        var response = await CreateAnonymousClient().GetAsync("/api/repairs");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var problem = await response.ReadProblemAsync();
        Assert.Equal(401, problem.Status);
        Assert.Equal("Musisz być zalogowany.", problem.Detail);
    }

    [Fact]
    public async Task Request_with_an_invalid_token_returns_401()
    {
        var client = CreateClientWithToken("not-a-real-token");

        var response = await client.GetAsync("/api/repairs");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Worker_without_the_permission_gets_403()
    {
        var worker = await CreateWorkerAsync();

        var response = await worker.Client.GetAsync("/api/repairs");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var problem = await response.ReadProblemAsync();
        Assert.Equal("Nie masz uprawnień do tej operacji.", problem.Detail);
    }

    [Fact]
    public async Task Worker_with_the_permission_gets_200()
    {
        var worker = await CreateWorkerAsync("ReadRepairs");

        var response = await worker.Client.GetAsync("/api/repairs");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
