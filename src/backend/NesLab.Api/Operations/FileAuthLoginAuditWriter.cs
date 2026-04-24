using System.Text.Json;

namespace NesLab.Api.Operations;

public sealed class FileAuthLoginAuditWriter : IAuthLoginAuditWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string _logPath;
    private readonly SemaphoreSlim _mutex = new(1, 1);

    public FileAuthLoginAuditWriter(IConfiguration configuration, IWebHostEnvironment env)
    {
        var configuredPath = configuration["Operations:AuthLoginAuditPath"];
        _logPath = string.IsNullOrWhiteSpace(configuredPath)
            ? Path.Combine(env.ContentRootPath, "logs", "auth-login-attempts.log")
            : (Path.IsPathRooted(configuredPath)
                ? configuredPath
                : Path.Combine(env.ContentRootPath, configuredPath));

        var directory = Path.GetDirectoryName(_logPath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }
    }

    public async Task WriteAsync(AuthLoginAuditEntry entry, CancellationToken cancellationToken = default)
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

    public async Task<IReadOnlyList<AuthLoginAuditEntry>> ReadRecentAsync(int take, CancellationToken cancellationToken = default)
    {
        if (take <= 0 || !File.Exists(_logPath))
        {
            return [];
        }

        await _mutex.WaitAsync(cancellationToken);
        try
        {
            var lines = await File.ReadAllLinesAsync(_logPath, cancellationToken);
            if (lines.Length == 0)
            {
                return [];
            }

            var results = new List<AuthLoginAuditEntry>(Math.Min(take, lines.Length));
            for (var i = lines.Length - 1; i >= 0 && results.Count < take; i--)
            {
                var line = lines[i];
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                var row = JsonSerializer.Deserialize<AuthLoginAuditEntry>(line, JsonOptions);
                if (row is not null)
                {
                    results.Add(row);
                }
            }

            return results;
        }
        finally
        {
            _mutex.Release();
        }
    }
}
