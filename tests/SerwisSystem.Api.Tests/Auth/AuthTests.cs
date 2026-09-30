using System.Net;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Models.Enums;
using SerwisSystem.Api.Tests.Infrastructure;

namespace SerwisSystem.Api.Tests.Auth;

[Collection(ApiCollection.Name)]
public class AuthTests : ApiTestBase
{
    public AuthTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Register_then_login_returns_a_token()
    {
        var username = UniqueName("user");
        var client = CreateAnonymousClient();

        var registerResponse = await client.PostJsonAsync("/api/auth/register", new RegisterDto
        {
            Username = username,
            Email = $"{username}@example.com",
            Password = "Secret123!"
        });

        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);
        var registered = await registerResponse.ReadJsonAsync<RegisterResponse>();
        Assert.Equal(username, registered.Username);
        Assert.Equal(UserRole.Worker, registered.Role);

        var loginResponse = await client.PostJsonAsync("/api/auth/login", new LoginDto
        {
            UsernameOrEmail = username,
            Password = "Secret123!"
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var login = await loginResponse.ReadJsonAsync<LoginResponse>();
        Assert.False(string.IsNullOrEmpty(login.Token));
    }

    [Fact]
    public async Task Login_accepts_the_email_instead_of_the_username()
    {
        var username = UniqueName("user");
        await RegisterAsync(username, "Secret123!");

        var response = await CreateAnonymousClient().PostJsonAsync("/api/auth/login", new LoginDto
        {
            UsernameOrEmail = $"{username}@example.com",
            Password = "Secret123!"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Register_with_a_taken_username_returns_409()
    {
        var username = UniqueName("user");
        await RegisterAsync(username);

        var response = await CreateAnonymousClient().PostJsonAsync("/api/auth/register", new RegisterDto
        {
            Username = username,
            Email = $"other-{username}@example.com",
            Password = "Secret123!"
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await response.ReadProblemAsync();
        Assert.Equal("Ta nazwa użytkownika jest już zajęta.", problem.Detail);
    }

    [Fact]
    public async Task Validation_errors_are_returned_in_polish_per_field()
    {
        var response = await CreateAnonymousClient().PostJsonAsync("/api/auth/register", new RegisterDto
        {
            Username = "",
            Email = "not-an-email",
            Password = "123"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.ReadValidationProblemAsync();
        Assert.Equal("Błędne dane.", problem.Title);
        Assert.Equal(["To pole jest wymagane."], problem.Errors["username"]);
        Assert.Equal(["Nieprawidłowy adres e-mail."], problem.Errors["email"]);
        Assert.Equal(["Minimum 6 znaków."], problem.Errors["password"]);
    }

    [Fact]
    public async Task Wrong_password_and_unknown_user_get_the_same_401_answer()
    {
        var username = UniqueName("user");
        await RegisterAsync(username, "Secret123!");
        var client = CreateAnonymousClient();

        var wrongPassword = await client.PostJsonAsync("/api/auth/login", new LoginDto
        {
            UsernameOrEmail = username,
            Password = "not-the-password"
        });
        var unknownUser = await client.PostJsonAsync("/api/auth/login", new LoginDto
        {
            UsernameOrEmail = UniqueName("nobody"),
            Password = "Secret123!"
        });

        // The same answer, so nobody can find out which usernames exist.
        Assert.Equal(HttpStatusCode.Unauthorized, wrongPassword.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknownUser.StatusCode);

        var wrongPasswordProblem = await wrongPassword.ReadProblemAsync();
        var unknownUserProblem = await unknownUser.ReadProblemAsync();
        Assert.Equal("Nieprawidłowy login lub hasło.", wrongPasswordProblem.Detail);
        Assert.Equal(wrongPasswordProblem.Detail, unknownUserProblem.Detail);
    }

    [Fact]
    public async Task First_admin_is_created_from_configuration()
    {
        var response = await CreateAnonymousClient().PostJsonAsync("/api/auth/login", new LoginDto
        {
            UsernameOrEmail = ApiFactory.AdminUsername,
            Password = ApiFactory.AdminPassword
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var login = await response.ReadJsonAsync<LoginResponse>();
        Assert.Equal(UserRole.Admin, login.Role);

        var admin = CreateClientWithToken(login.Token);
        var profile = await (await admin.GetAsync("/api/users/logged")).ReadJsonAsync<UserResponseDto>();
        Assert.Equal(ApiFactory.AdminEmail, profile.Email);
        Assert.Equal(1, profile.Priority);
    }

    [Fact]
    public async Task Create_first_admin_endpoint_no_longer_exists()
    {
        var response = await CreateAnonymousClient().PostJsonAsync("/api/auth/create-first-admin", new RegisterDto
        {
            Username = UniqueName("intruder"),
            Email = "intruder@example.com",
            Password = "Secret123!"
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
