namespace NesLab.Domain.Entities;

public sealed class IdempotencyRecord
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string KeyHash { get; set; } = string.Empty;
    public int? OrderId { get; set; }
    public LabOrder? Order { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAtUtc { get; set; }
}
