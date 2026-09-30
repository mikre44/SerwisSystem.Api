using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace SerwisSystem.Api.Tests.Infrastructure;

// Short helpers for JSON requests, with the same JSON settings as the API
// (camelCase names, enums as strings).
public static class HttpExtensions
{
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public static Task<HttpResponseMessage> PostJsonAsync(this HttpClient client, string url, object body)
    {
        return client.PostAsJsonAsync(url, body, JsonOptions);
    }

    public static Task<HttpResponseMessage> PutJsonAsync(this HttpClient client, string url, object body)
    {
        return client.PutAsJsonAsync(url, body, JsonOptions);
    }

    // For actions without a body, e.g. POST api/repairs/5/take.
    public static Task<HttpResponseMessage> PostEmptyAsync(this HttpClient client, string url)
    {
        return client.PostAsync(url, content: null);
    }

    public static async Task<T> ReadJsonAsync<T>(this HttpResponseMessage response)
    {
        var value = await response.Content.ReadFromJsonAsync<T>(JsonOptions);
        return value ?? throw new InvalidOperationException("The response body is empty.");
    }

    public static Task<ProblemDetails> ReadProblemAsync(this HttpResponseMessage response)
    {
        return response.ReadJsonAsync<ProblemDetails>();
    }

    public static Task<ValidationProblemDetails> ReadValidationProblemAsync(this HttpResponseMessage response)
    {
        return response.ReadJsonAsync<ValidationProblemDetails>();
    }
}
