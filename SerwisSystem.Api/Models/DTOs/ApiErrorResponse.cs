namespace SerwisSystem.Api.Models.DTOs;

public sealed record ApiErrorResponse(
    int Status,
    string Message,
    Dictionary<string, string[]>? Errors = null);
