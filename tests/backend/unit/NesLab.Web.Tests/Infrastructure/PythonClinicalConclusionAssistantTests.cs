using System.Net;
using System.Net.Http;
using System.Text;
using Microsoft.Extensions.Configuration;
using NesLab.Application.DTOs;
using NesLab.Infrastructure.Services;

namespace NesLab.Web.Tests.Infrastructure;

public sealed class PythonClinicalConclusionAssistantTests
{
    [Fact]
    public async Task SuggestAsync_returns_payload_when_service_is_ok()
    {
        var payload = """
        {
          "draftConclusion":"Borrador",
          "interpretation":"Interpretacion",
          "suggestedFollowUp":"Seguimiento",
          "limitations":"Limitaciones",
          "disclaimer":"Disclaimer",
          "confidenceLevel":"media",
          "references":[{"title":"Ref","url":"https://example.org","source":"PubMed","publishedAtUtc":null}]
        }
        """;
        using var client = new HttpClient(new StubHandler(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        }))
        {
            BaseAddress = new Uri("http://localhost:8091")
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(
        [
            new KeyValuePair<string, string?>("AiAssistant:ServiceToken", "token-1")
        ]).Build();
        var sut = new PythonClinicalConclusionAssistant(client, config);

        var result = await sut.SuggestAsync(new SuggestConclusionRequestDto(
            1,
            1,
            "HB",
            "Hemoglobina",
            "texto",
            "Paciente Demo",
            null,
            null,
            "nota",
            []));

        Assert.Equal("Borrador", result.DraftConclusion);
        Assert.Single(result.References);
    }

    private sealed class StubHandler(HttpResponseMessage response) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(response);
        }
    }
}
