using System.Net;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Tests.Infrastructure;

namespace SerwisSystem.Api.Tests.Repairs;

[Collection(ApiCollection.Name)]
public class RepairSortingTests : ApiTestBase
{
    public RepairSortingTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Repairs_can_be_sorted_by_reporter_surname()
    {
        // A unique company name lets the search find only the repairs of this test.
        var company = UniqueName("company");

        foreach (var surname in new[] { "Nowak", "Zawadzki", "Adamczyk" })
        {
            var data = ValidRepair();
            data.CompanyName = company;
            data.ReporterSurname = surname;
            await CreateRepairAsync(data);
        }

        var worker = await CreateWorkerAsync("ReadRepairs");

        var response = await worker.Client.GetAsync(
            $"/api/repairs?search={company}&sortBy=reporterSurname&descending=false");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var page = await response.ReadJsonAsync<PagedResponse<RepairResponseDto>>();
        Assert.Equal(["Adamczyk", "Nowak", "Zawadzki"], page.Items.Select(r => r.ReporterSurname));
    }

    [Fact]
    public async Task Unknown_sort_key_returns_400()
    {
        var worker = await CreateWorkerAsync("ReadRepairs");

        var response = await worker.Client.GetAsync("/api/repairs?sortBy=passwordHash");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.ReadProblemAsync();
        Assert.StartsWith("Nieznana wartość sortBy 'passwordHash'.", problem.Detail);
    }
}
