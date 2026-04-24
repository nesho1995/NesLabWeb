using NesLab.Infrastructure.Fiscal;

namespace NesLab.Web.Tests.Infrastructure;

public class FiscalBrandingParserTests
{
    [Fact]
    public void Null_ReturnsNull() => Assert.Null(FiscalBrandingParser.FromJson(null));

    [Fact(DisplayName = "Config: JSON con camelCase se deserializa")]
    public void JsonVacioOCamelCase_Soportado()
    {
        const string json = """{"documentTitleSar":"T1","documentTitleInternal":"T2","footerLines":["A"]}""";
        var b = FiscalBrandingParser.FromJson(json);
        Assert.NotNull(b);
        Assert.Equal("T1", b!.DocumentTitleSar);
        Assert.Equal("T2", b.DocumentTitleInternal);
        Assert.Equal(new[] { "A" }, b.FooterLines);
    }
}
