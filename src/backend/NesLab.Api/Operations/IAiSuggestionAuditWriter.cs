namespace NesLab.Api.Operations;

public interface IAiSuggestionAuditWriter
{
    Task WriteAsync(AiSuggestionAuditEntry entry, CancellationToken cancellationToken = default);
}
