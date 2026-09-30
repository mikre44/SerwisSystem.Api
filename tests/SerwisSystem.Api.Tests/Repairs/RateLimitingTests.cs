using System.Net;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Tests.Infrastructure;

namespace SerwisSystem.Api.Tests.Repairs;

[Collection(ApiCollection.Name)]
public class RateLimitingTests
{
    [Fact]
    public async Task Public_endpoints_allow_10_requests_per_minute_by_default()
    {
        // The shared ApiFactory raises the limit for the other tests, so this test starts
        // its own copy of the API with the limit from appsettings.json.
        await using var factory = new ApiFactory { PublicPermitLimit = null };
        var client = factory.CreateClient();
        var check = new CheckRepairDto { Id = int.MaxValue, Email = "nobody@example.com" };

        for (var i = 0; i < 10; i++)
        {
            var allowed = await client.PostJsonAsync("/api/repairs/check", check);
            Assert.Equal(HttpStatusCode.NotFound, allowed.StatusCode);
        }

        var rejected = await client.PostJsonAsync("/api/repairs/check", check);

        Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);
        var problem = await rejected.ReadProblemAsync();
        Assert.Equal("Too many requests. Try again in a minute.", problem.Detail);
    }
}
