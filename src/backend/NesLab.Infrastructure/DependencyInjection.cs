using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NesLab.Application.Interfaces;
using NesLab.Infrastructure.Fiscal;
using NesLab.Infrastructure.Persistence;
using NesLab.Infrastructure.Services;
using NesLab.Infrastructure.Security;
using NesLab.Infrastructure.Tenancy;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace NesLab.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MySql")
            ?? "Server=localhost;Port=3306;Database=neslab;User=neslab;Password=neslab;";

        var serverVersion = new MySqlServerVersion(new Version(8, 4, 0));
        services.AddDbContext<NesLabDbContext>(options =>
            options.UseMySql(connectionString, serverVersion));

        services.AddScoped<IPasswordHasher, PasswordHasherService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddSingleton<ITenantContext, TenantContext>();
        services.AddScoped<IPatientService, PatientService>();
        services.AddScoped<ILabExamService, LabExamService>();
        services.AddScoped<IFiscalQueryService, FiscalQueryService>();
        services.AddScoped<IFiscalCommandService, FiscalCommandService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ILabResultService, LabResultService>();
        services.AddScoped<ISampleService, SampleService>();
        services.AddScoped<IUserQueryService, UserQueryService>();
        services.AddScoped<IRoleQueryService, RoleQueryService>();
        services.AddScoped<IUserCommandService, UserCommandService>();
        services.AddScoped<ICompanyCashSettingsService, CompanyCashSettingsService>();
        services.AddScoped<ICashSessionService, CashSessionService>();
        services.AddScoped<ICompanyPaymentMethodService, CompanyPaymentMethodService>();
        services.AddScoped<ILabDashboardService, LabDashboardService>();
        services.AddScoped<IReagentInventoryService, ReagentInventoryService>();
        services.AddScoped<IOfflineSyncService, OfflineSyncService>();

        return services;
    }
}
