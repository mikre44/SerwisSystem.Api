using Microsoft.AspNetCore.Diagnostics;

namespace SerwisSystem.Api.Services;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(
            exception,
            "Unhandled exception occurred.");

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;

        await httpContext.Response.WriteAsJsonAsync(new
        {
            status = 500,
            message = "An unexpected error occurred."
        }, cancellationToken);

        return true;
    }
}