using System.Net;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Models.Enums;
using SerwisSystem.Api.Tests.Infrastructure;

namespace SerwisSystem.Api.Tests.Repairs;

// PUT api/repairs/{id}/status lets an admin correct a mistake, but only along the allowed transitions.
[Collection(ApiCollection.Name)]
public class RepairStatusCorrectionTests : ApiTestBase
{
    public RepairStatusCorrectionTests(ApiFactory factory) : base(factory)
    {
    }

    [Theory]
    [InlineData(RepairStatus.Pending, RepairStatus.Cancelled, true)]
    [InlineData(RepairStatus.Pending, RepairStatus.InProgress, false)]
    [InlineData(RepairStatus.Pending, RepairStatus.Completed, false)]
    [InlineData(RepairStatus.InProgress, RepairStatus.Pending, true)]
    [InlineData(RepairStatus.InProgress, RepairStatus.Cancelled, true)]
    [InlineData(RepairStatus.InProgress, RepairStatus.Completed, false)]
    [InlineData(RepairStatus.Completed, RepairStatus.InProgress, true)]
    [InlineData(RepairStatus.Completed, RepairStatus.Pending, false)]
    [InlineData(RepairStatus.Completed, RepairStatus.Cancelled, false)]
    [InlineData(RepairStatus.Cancelled, RepairStatus.Pending, true)]
    [InlineData(RepairStatus.Cancelled, RepairStatus.InProgress, false)]
    [InlineData(RepairStatus.Cancelled, RepairStatus.Completed, false)]
    public async Task Admin_can_change_the_status_only_along_allowed_transitions(
        RepairStatus from, RepairStatus to, bool allowed)
    {
        var admin = await LoginAsAdminAsync();
        var repairId = await CreateRepairWithStatusAsync(admin, from);

        var response = await admin.PutJsonAsync(
            $"/api/repairs/{repairId}/status",
            new UpdateRepairStatusDto { Status = to });

        if (allowed)
        {
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var repair = await response.ReadJsonAsync<RepairResponseDto>();
            Assert.Equal(to, repair.Status);
        }
        else
        {
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var problem = await response.ReadProblemAsync();
            Assert.EndsWith("jest niedozwolona.", problem.Detail);
        }
    }

    [Fact]
    public async Task Rejected_change_names_both_statuses_in_polish()
    {
        var admin = await LoginAsAdminAsync();
        var repairId = await CreateRepairWithStatusAsync(admin, RepairStatus.Completed);

        var response = await admin.PutJsonAsync(
            $"/api/repairs/{repairId}/status",
            new UpdateRepairStatusDto { Status = RepairStatus.Pending });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.ReadProblemAsync();
        Assert.Equal("Zmiana statusu z „Zakończona” na „Oczekująca” jest niedozwolona.", problem.Detail);
    }

    [Fact]
    public async Task Moving_back_to_pending_unassigns_the_worker()
    {
        var admin = await LoginAsAdminAsync();
        var repairId = await CreateRepairWithStatusAsync(admin, RepairStatus.InProgress);

        var response = await admin.PutJsonAsync(
            $"/api/repairs/{repairId}/status",
            new UpdateRepairStatusDto { Status = RepairStatus.Pending });

        var repair = await response.ReadJsonAsync<RepairResponseDto>();
        Assert.Null(repair.WorkerId);
    }

    [Fact]
    public async Task Reopening_a_completed_repair_keeps_the_worker()
    {
        var admin = await LoginAsAdminAsync();
        var repairId = await CreateRepairWithStatusAsync(admin, RepairStatus.Completed);

        var response = await admin.PutJsonAsync(
            $"/api/repairs/{repairId}/status",
            new UpdateRepairStatusDto { Status = RepairStatus.InProgress });

        var repair = await response.ReadJsonAsync<RepairResponseDto>();
        Assert.NotNull(repair.WorkerId);
    }

    [Fact]
    public async Task Worker_who_is_not_an_admin_gets_403()
    {
        var repair = await CreateRepairAsync();
        var worker = await CreateWorkerAsync("ReadRepairs", "TakeRepairs", "EditRepairs", "DeleteRepairs");

        var response = await worker.Client.PutJsonAsync(
            $"/api/repairs/{repair.Id}/status",
            new UpdateRepairStatusDto { Status = RepairStatus.Cancelled });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // Brings a new repair to the given status with the everyday actions (take, complete, cancel).
    private async Task<int> CreateRepairWithStatusAsync(HttpClient admin, RepairStatus status)
    {
        var repair = await CreateRepairAsync();

        if (status is RepairStatus.InProgress or RepairStatus.Completed)
            await admin.PostEmptyAsync($"/api/repairs/{repair.Id}/take");

        if (status == RepairStatus.Completed)
            await admin.PostEmptyAsync($"/api/repairs/{repair.Id}/complete");

        if (status == RepairStatus.Cancelled)
            await admin.PostEmptyAsync($"/api/repairs/{repair.Id}/cancel");

        var current = await (await admin.GetAsync($"/api/repairs/{repair.Id}")).ReadJsonAsync<RepairResponseDto>();
        Assert.Equal(status, current.Status);

        return repair.Id;
    }
}
