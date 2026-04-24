using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace NesLab.Infrastructure.Persistence;

public sealed class NesLabDbContextFactory : IDesignTimeDbContextFactory<NesLabDbContext>
{
    public NesLabDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__MySql")
            ?? "Server=localhost;Port=3307;Database=neslab;User=root;Password=;";
        var version = new MySqlServerVersion(new Version(8, 4, 0));
        var options = new DbContextOptionsBuilder<NesLabDbContext>()
            .UseMySql(connectionString, version)
            .Options;
        return new NesLabDbContext(options);
    }
}
