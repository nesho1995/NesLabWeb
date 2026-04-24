namespace NesLab.Application.Interfaces;

public interface IPasswordHasher
{
    string HashPbkdf2(string plainText);
    bool VerifyPbkdf2(string plainText, string hash);
    string HashLegacySha256(string plainText);
    bool VerifyLegacySha256(string plainText, string hash);
}
