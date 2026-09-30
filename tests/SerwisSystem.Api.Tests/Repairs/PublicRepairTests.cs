using System.Net;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Models.Enums;
using SerwisSystem.Api.Tests.Infrastructure;

namespace SerwisSystem.Api.Tests.Repairs;

// The anonymous endpoints used by the customer app: report a repair and check its status.
[Collection(ApiCollection.Name)]
public class PublicRepairTests : ApiTestBase
{
    public PublicRepairTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Status_check_compares_the_email_case_insensitively()
    {
        var data = ValidRepair();
        data.ReporterEmail = $"Jan.{UniqueName("Kowalski")}@Example.com";
        var repair = await CreateRepairAsync(data);

        var response = await CreateAnonymousClient().PostJsonAsync("/api/repairs/check", new CheckRepairDto
        {
            Id = repair.Id,
            Email = data.ReporterEmail.ToUpperInvariant()
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var status = await response.ReadJsonAsync<PublicRepairResponseDto>();
        Assert.Equal(repair.Id, status.Id);
        Assert.Equal(RepairStatus.Pending, status.Status);
    }

    [Fact]
    public async Task Status_check_with_a_different_email_returns_404()
    {
        var repair = await CreateRepairAsync();

        var response = await CreateAnonymousClient().PostJsonAsync("/api/repairs/check", new CheckRepairDto
        {
            Id = repair.Id,
            Email = "someone.else@example.com"
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Invalid_serial_number_for_a_catalogue_product_returns_400_with_a_field_error()
    {
        var data = ValidRepair();
        data.SerialNumber = "ABC123";

        var response = await CreateAnonymousClient().PostJsonAsync("/api/repairs", data);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.ReadValidationProblemAsync();
        Assert.Equal("Validation failed.", problem.Title);
        Assert.True(problem.Errors.ContainsKey("serialNumber"));
    }

    [Fact]
    public async Task Custom_product_can_be_reported_without_a_serial_number()
    {
        var data = ValidRepair();
        data.Product = "Drukarka 3D spoza katalogu";
        data.IsCustomProduct = true;
        data.SerialNumber = null;

        var response = await CreateAnonymousClient().PostJsonAsync("/api/repairs", data);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var repair = await response.ReadJsonAsync<PublicRepairResponseDto>();
        Assert.Null(repair.SerialNumber);
    }
}
