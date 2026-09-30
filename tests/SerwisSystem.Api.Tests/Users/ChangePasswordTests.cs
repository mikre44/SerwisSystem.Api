using System.Net;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Tests.Infrastructure;

namespace SerwisSystem.Api.Tests.Users;

[Collection(ApiCollection.Name)]
public class ChangePasswordTests : ApiTestBase
{
    public ChangePasswordTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task After_the_change_only_the_new_password_works()
    {
        var worker = await CreateWorkerAsync();

        var response = await worker.Client.PutJsonAsync("/api/users/change-password", new ChangePasswordDto
        {
            CurrentPassword = worker.Password,
            NewPassword = "NewSecret456!"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var loginWithOld = await CreateAnonymousClient().PostJsonAsync("/api/auth/login",
            new LoginDto { UsernameOrEmail = worker.Username, Password = worker.Password });
        var loginWithNew = await CreateAnonymousClient().PostJsonAsync("/api/auth/login",
            new LoginDto { UsernameOrEmail = worker.Username, Password = "NewSecret456!" });

        Assert.Equal(HttpStatusCode.Unauthorized, loginWithOld.StatusCode);
        Assert.Equal(HttpStatusCode.OK, loginWithNew.StatusCode);
    }

    [Fact]
    public async Task Wrong_current_password_returns_400()
    {
        var worker = await CreateWorkerAsync();

        var response = await worker.Client.PutJsonAsync("/api/users/change-password", new ChangePasswordDto
        {
            CurrentPassword = "not-the-password",
            NewPassword = "NewSecret456!"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.ReadProblemAsync();
        Assert.Equal("Obecne hasło jest nieprawidłowe.", problem.Detail);
    }
}
