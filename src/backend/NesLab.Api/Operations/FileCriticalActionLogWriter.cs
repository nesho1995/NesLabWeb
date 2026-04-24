using System.Text.Json;

namespace NesLab.Api.Operations;

public sealed class FileCriticalActionLogWriter : ICriticalActionLogWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string _logPath;
    private readonly SemaphoreSlim _mutex = new(1, 1);

    public FileCriticalActionLogWriter(IConfiguration configuration, IWebHostEnvironment env)
    {
        var configuredPath = configuration["Operations:CriticalLogPath"];
        _logPath = string.IsNullOrWhiteSpace(configuredPath)
            ? Path.Combine(env.ContentRootPath, "logs", "critical-actions.log")
            : (Path.IsPathRooted(configuredPath)
                ? configuredPath
                : Path.Combine(env.ContentRootPath, configuredPath));

        var directory = Path.GetDirectoryName(_logPath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }
    }

    public async Task WriteAsync(CriticalActionLogEntry entry, CancellationToken cancellationToken = default)
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

    public async Task<IReadOnlyList<CriticalActionLogEntry>> ReadRecentAsync(int take, CancellationToken cancellationToken = default)
    {
        if (take <= 0)
        {
            return [];
        }

        if (!File.Exists(_logPath))
        {
            return [];
        }

        string[] lines;
        await _mutex.WaitAsync(cancellationToken);
        try
        {
            lines = await File.ReadAllLinesAsync(_logPath, cancellationToken);
        }
        finally
        {
            _mutex.Release();
        }

        var result = new List<CriticalActionLogEntry>(Math.Min(take, lines.Length));
        foreach (var line in lines.Reverse().Take(take))
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            try
            {
                var item = JsonSerializer.Deserialize<CriticalActionLogEntry>(line, JsonOptions);
                if (item is not null)
                {
                    result.Add(item);
                }
            }
            catch (JsonException)
            {
                // Skip malformed lines to keep audit read robust.
            }
        }

        return result;
    }
}
