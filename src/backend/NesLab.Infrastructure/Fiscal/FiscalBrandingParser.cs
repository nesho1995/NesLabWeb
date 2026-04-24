using System.Text.Json;
using NesLab.Application.DTOs;

namespace NesLab.Infrastructure.Fiscal;

public static class FiscalBrandingParser
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    public static FiscalBrandingDto? FromJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }
        try
        {
            return JsonSerializer.Deserialize<FiscalBrandingDto>(json, Json);
        }
        catch
        {
            return null;
        }
    }

}
