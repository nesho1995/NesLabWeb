namespace NesLab.Api.Operations;

public interface ICriticalActionLogWriter
{
    Task WriteAsync(CriticalActionLogEntry entry, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CriticalActionLogEntry>> ReadRecentAsync(int take, CancellationToken cancellationToken = default);
}
