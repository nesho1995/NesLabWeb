using Microsoft.Extensions.Configuration;
using NesLab.Application.Interfaces;

namespace NesLab.Infrastructure.Tenancy;

public sealed class TenantContext : ITenantContext
{
    public int CompanyId { get; }

    public TenantContext(IConfiguration configuration)
    {
        CompanyId = configuration.GetValue("Lab:DefaultCompanyId", 1);
    }
}
