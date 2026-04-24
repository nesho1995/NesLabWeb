using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using NesLab.Application.DTOs;
using NesLab.Application.Interfaces;

namespace NesLab.Infrastructure.Services;

public sealed class PythonClinicalConclusionAssistant(HttpClient httpClient, IConfiguration configuration)
    : IClinicalConclusionAssistant
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string _serviceToken = configuration["AiAssistant:ServiceToken"] ?? string.Empty;

    public async Task<SuggestConclusionResponseDto> SuggestAsync(
        SuggestConclusionRequestDto request,
        CancellationToken cancellationToken = default)
    {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/suggest-conclusion")
        {
            Content = JsonContent.Create(request, options: JsonOptions)
        };
        if (!string.IsNullOrWhiteSpace(_serviceToken))
        {
            httpRequest.Headers.TryAddWithoutValidation("X-Service-Token", _serviceToken);
        }

        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException(
                $"Asistente IA no disponible ({(int)response.StatusCode}). {body}".Trim());
        }

        var payload = await response.Content.ReadFromJsonAsync<SuggestConclusionResponseDto>(
            options: JsonOptions,
            cancellationToken: cancellationToken);
        if (payload is null)
        {
            throw new InvalidOperationException("Asistente IA devolvió una respuesta vacía.");
        }

        return payload;
    }
}
