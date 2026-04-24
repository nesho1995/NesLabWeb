using System.Text.Json;

namespace NesLab.Api.Operations;

public sealed class FileAiSuggestionAuditWriter : IAiSuggestionAuditWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string _logPath;
    private readonly SemaphoreSlim _mutex = new(1, 1);

    public FileAiSuggestionAuditWriter(IConfiguration configuration, IWebHostEnvironment env)
    {
        var configuredPath = configuration["Operations:AiSuggestionAuditPath"];
        _logPath = string.IsNullOrWhiteSpace(configuredPath)
            ? Path.Combine(env.ContentRootPath, "logs", "ai-suggestions.log")
            : (Path.IsPathRooted(configuredPath)
                ? configuredPath
                : Path.Combine(env.ContentRootPath, configuredPath));

        var directory = Path.GetDirectoryName(_logPath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }
    }

    public async Task WriteAsync(AiSuggestionAuditEntry entry, CancellationToken cancellationToken = default)
    {
        var line = JsonSerializer.Serialize(entry, JsonOptions) + Environment.NewLine;
        await _mutex.WaitAsync(cancellationToken);
        try
        {
            await File.AppendAllTextAsync(_logPath, line, cancellationToken);
        }
        finally
        {
            _mutex.Release();
        }
    }
}
