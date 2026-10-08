using SerwisSystem.Api.Models.DTOs;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Npgsql;
namespace SerwisSystem.Api.Services;
public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is OperationCanceledException && context.RequestAborted.IsCancellationRequested)
            return true;
        var conflict = exception is DbUpdateConcurrencyException;
        var duplicate = exception is DbUpdateException { InnerException: PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } };
        var status = conflict || duplicate ? 409 : 500;
        var message = conflict ? "Dane zostały zmienione. Wczytaj je ponownie przed zapisaniem."
            : duplicate ? "Wpis z takimi danymi już istnieje."
            : "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.";
        if (status == 500) logger.LogError(exception, "Unhandled application error.");
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new ApiErrorResponse(status, message), cancellationToken);
        return true;
    }
}
