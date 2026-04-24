using NesLab.Domain.Entities;

namespace NesLab.Application.Interfaces;

public interface IJwtTokenGenerator
{
    (string token, DateTime expiresAtUtc) Generate(User user, IReadOnlyList<string> roles, IReadOnlyList<string> permissions);
}
