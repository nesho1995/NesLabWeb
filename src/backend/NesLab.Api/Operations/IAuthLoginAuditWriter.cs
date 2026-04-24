namespace NesLab.Api.Operations;

public interface IAuthLoginAuditWriter
{
    Task WriteAsync(AuthLoginAuditEntry entry, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AuthLoginAuditEntry>> ReadRecentAsync(int take, CancellationToken cancellationToken = default);
}
