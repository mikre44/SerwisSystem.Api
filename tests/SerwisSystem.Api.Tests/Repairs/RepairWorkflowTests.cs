using System.Net;
using System.Text.Json;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Models.Enums;
using SerwisSystem.Api.Tests.Infrastructure;

namespace SerwisSystem.Api.Tests.Repairs;

// Everyday work on a repair: a customer reports it, a worker takes it and completes it.
[Collection(ApiCollection.Name)]
public class RepairWorkflowTests : ApiTestBase
{
    public RepairWorkflowTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Reported_repair_can_be_taken_and_completed_by_a_worker()
    {
        var repair = await CreateRepairAsync();
        var worker = await CreateWorkerAsync("TakeRepairs");

        Assert.Equal(RepairStatus.Pending, repair.Status);

        var takeResponse = await worker.Client.PostEmptyAsync($"/api/repairs/{repair.Id}/take");

        Assert.Equal(HttpStatusCode.OK, takeResponse.StatusCode);
        var taken = await takeResponse.ReadJsonAsync<RepairResponseDto>();
        Assert.Equal(RepairStatus.InProgress, taken.Status);
        Assert.Equal(worker.Id, taken.WorkerId);
        Assert.Equal(worker.Username, taken.WorkerUsername);

        var completeResponse = await worker.Client.PostEmptyAsync($"/api/repairs/{repair.Id}/complete");

        Assert.Equal(HttpStatusCode.OK, completeResponse.StatusCode);
        var completed = await completeResponse.ReadJsonAsync<RepairResponseDto>();
        Assert.Equal(RepairStatus.Completed, completed.Status);
        Assert.Equal(worker.Id, completed.WorkerId);
    }

    [Fact]
    public async Task Returned_repair_goes_back_to_the_queue_without_a_worker()
    {
        var repair = await CreateRepairAsync();
        var worker = await CreateWorkerAsync("TakeRepairs");
        await worker.Client.PostEmptyAsync($"/api/repairs/{repair.Id}/take");

        var response = await worker.Client.PostEmptyAsync($"/api/repairs/{repair.Id}/return");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var returned = await response.ReadJsonAsync<RepairResponseDto>();
        Assert.Equal(RepairStatus.Pending, returned.Status);
        Assert.Null(returned.WorkerId);
    }

    [Fact]
    public async Task Another_worker_cannot_complete_the_repair()
    {
        var repair = await CreateRepairAsync();
        var assignedWorker = await CreateWorkerAsync("TakeRepairs");
        var otherWorker = await CreateWorkerAsync("TakeRepairs");
        await assignedWorker.Client.PostEmptyAsync($"/api/repairs/{repair.Id}/take");

        var response = await otherWorker.Client.PostEmptyAsync($"/api/repairs/{repair.Id}/complete");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Repair_without_a_serial_number_returns_null_serial_number()
    {
        var data = ValidRepair();
        data.Product = "Meble";
        data.SerialNumber = null;
        var repair = await CreateRepairAsync(data);
        var worker = await CreateWorkerAsync("ReadRepairs");

        var response = await worker.Client.GetAsync($"/api/repairs/{repair.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var details = await response.ReadJsonAsync<RepairResponseDto>();
        Assert.Null(details.SerialNumber);
    }

    [Fact]
    public async Task Edit_changes_the_data_but_ignores_a_status_in_the_body()
    {
        var repair = await CreateRepairAsync();
        var worker = await CreateWorkerAsync("EditRepairs");

        // The edit form sends repair data only; a "status" field added by hand must be ignored.
        var edited = ValidRepair();
        edited.Description = "Pęknięta matryca.";
        var body = JsonSerializer.SerializeToNode(edited, HttpExtensions.JsonOptions)!;
        body["status"] = "Completed";

        var response = await worker.Client.PutJsonAsync($"/api/repairs/{repair.Id}", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.ReadJsonAsync<RepairResponseDto>();
        Assert.Equal("Pęknięta matryca.", updated.Description);
        Assert.Equal(RepairStatus.Pending, updated.Status);
    }
}
