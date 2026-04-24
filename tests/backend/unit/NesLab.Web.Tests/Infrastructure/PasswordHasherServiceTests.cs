using NesLab.Infrastructure.Security;

namespace NesLab.Web.Tests.Infrastructure;

/// <summary>Usuario: contrasena y verificacion PBKDF2.</summary>
public class PasswordHasherServiceTests
{
    [Fact(DisplayName = "Auth: la misma contrasena pasa la verificacion con el hash generado")]
    public void HashPbkdf2_AndVerify_RoundTrip()
    {
        var s = new PasswordHasherService();
        const string p = "M1Segura!";
        var h = s.HashPbkdf2(p);
        Assert.StartsWith("PBKDF2$", h, StringComparison.Ordinal);
        Assert.True(s.VerifyPbkdf2(p, h));
        Assert.False(s.VerifyPbkdf2("otra", h));
    }

    [Fact(DisplayName = "Auth: legacy SHA256 hex se verifica en cascada (compat)")]
    public void Sha256_Stable()
    {
        var s = new PasswordHasherService();
        var h = s.HashLegacySha256("a");
        Assert.Equal(64, h.Length);
        Assert.True(s.VerifyLegacySha256("a", h));
    }
}
