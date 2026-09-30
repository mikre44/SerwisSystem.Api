using System.Net;
using System.Net.Http.Headers;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Tests.Infrastructure;

// Responses of AuthController (it returns anonymous objects, so the tests describe their shape here).
public record RegisterResponse(int Id, string Username, string Email, UserRole Role);

public record LoginResponse(string Token, UserRole Role);

// The page returned by GET api/repairs and GET api/users.
public record PagedResponse<T>(List<T> Items, int Page, int PageSize, int TotalCount, int TotalPages);

// A registered user together with a client that sends their token.
public record TestUser(int Id, string Username, string Password, HttpClient Client);

// Helpers shared by the integration tests. Every test creates its own users and repairs
// with unique names, so tests do not depend on each other or on the order they run in.
public abstract class ApiTestBase
{
    protected const string WorkerPassword = "Worker123!";

    protected ApiTestBase(ApiFactory factory)
    {
        Factory = factory;
    }

    protected ApiFactory Factory { get; }

    protected static string UniqueName(string prefix)
    {
        return $"{prefix}-{Guid.NewGuid():N}";
    }

    protected HttpClient CreateAnonymousClient()
    {
        return Factory.CreateClient();
    }

    protected HttpClient CreateClientWithToken(string token)
    {
        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    protected async Task<HttpClient> LoginAsync(string usernameOrEmail, string password)
    {
        var response = await CreateAnonymousClient().PostJsonAsync(
            "/api/auth/login",
            new LoginDto { UsernameOrEmail = usernameOrEmail, Password = password });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var login = await response.ReadJsonAsync<LoginResponse>();
        return CreateClientWithToken(login.Token);
    }

    protected Task<HttpClient> LoginAsAdminAsync()
    {
        return LoginAsync(ApiFactory.AdminUsername, ApiFactory.AdminPassword);
    }

    protected async Task<RegisterResponse> RegisterAsync(string username, string password = WorkerPassword)
    {
        var response = await CreateAnonymousClient().PostJsonAsync(
            "/api/auth/register",
            new RegisterDto { Username = username, Email = $"{username}@example.com", Password = password });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        return await response.ReadJsonAsync<RegisterResponse>();
    }

    // Registers a new worker, lets the first admin grant the given permissions
    // (e.g. "ReadRepairs") and logs the worker in.
    protected async Task<TestUser> CreateWorkerAsync(params string[] permissions)
    {
        var username = UniqueName("worker");
        var registered = await RegisterAsync(username);

        if (permissions.Length > 0)
        {
            var admin = await LoginAsAdminAsync();

            var response = await admin.PutJsonAsync(
                $"/api/users/grant/{registered.Id}",
                new UpdatePermissionsDto { PermissionsGranted = [.. permissions] });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        var client = await LoginAsync(username, WorkerPassword);
        return new TestUser(registered.Id, username, WorkerPassword, client);
    }

    // Data of a repair that passes validation. Tests change only the fields they care about.
    protected static CreateRepairDto ValidRepair()
    {
        return new CreateRepairDto
        {
            Product = "Monitor interaktywny myBoard Titan (Android 15)",
            SerialNumber = "L250101056500123",
            Description = "Monitor nie włącza się.",
            ReporterName = "Jan",
            ReporterSurname = "Kowalski",
            ReporterPhone = "600100200",
            ReporterEmail = $"{UniqueName("reporter")}@example.com",
            CompanyName = "Szkoła Podstawowa nr 1",
            CompanyAddress = "ul. Szkolna 1",
            CompanyPostalCode = "00-001",
            CompanyCity = "Warszawa",
            CompanyNip = "1234567890",
            ServiceDataConsent = true
        };
    }

    // Reports a repair the way the customer app does: anonymously.
    protected async Task<PublicRepairResponseDto> CreateRepairAsync(CreateRepairDto? repair = null)
    {
        var response = await CreateAnonymousClient().PostJsonAsync("/api/repairs", repair ?? ValidRepair());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        return await response.ReadJsonAsync<PublicRepairResponseDto>();
    }
}
