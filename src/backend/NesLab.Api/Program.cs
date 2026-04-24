using System.Reflection;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NesLab.Application.Abstractions;
using NesLab.Application.Interfaces;
using NesLab.Api.Operations;
using NesLab.Api.Security;
using NesLab.Infrastructure;
using NesLab.Infrastructure.Persistence;
using NesLab.Infrastructure.Persistence.Seed;

var builder = WebApplication.CreateBuilder(args);
if (builder.Environment.IsDevelopment())
{
    _ = builder.Configuration.AddUserSecrets(typeof(Program).Assembly, optional: true);
}

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<ICriticalActionLogWriter, FileCriticalActionLogWriter>();
builder.Services.AddScoped<ICurrentUserContext, HttpUserContext>();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync("{\"message\":\"Demasiadas solicitudes. Intente de nuevo en unos segundos.\"}", token);
    };

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var forwarded = httpContext.Request.Headers["X-Forwarded-For"].ToString();
        var remote = string.IsNullOrWhiteSpace(forwarded)
            ? httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
            : forwarded.Split(',')[0].Trim();

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"global:{remote}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            });
    });

    options.AddPolicy("AuthLoginPolicy", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"login:{ip}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            });
    });
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5225",
                "http://127.0.0.1:5225")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is required.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "NesLabWeb";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "NesLabWebClient";
if (builder.Environment.IsProduction() && jwtSecret.Contains("ChangeInProduction", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException("Jwt:Secret must be replaced in production.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireOrderCreate", policy => policy.RequireClaim("permission", "ORDEN.CREATE"));
    options.AddPolicy("RequireOrderRead", policy => policy.RequireAssertion(c =>
        c.User.HasClaim("permission", "ORDEN.READ")
        || c.User.HasClaim("permission", "ORDEN.CREATE")));
    options.AddPolicy("RequirePatientRead", policy => policy.RequireClaim("permission", "PACIENTE.READ"));
    options.AddPolicy("RequirePatientWrite", policy => policy.RequireClaim("permission", "PACIENTE.WRITE"));
    options.AddPolicy("RequireExamRead", policy => policy.RequireClaim("permission", "EXAMEN.READ"));
    options.AddPolicy("RequireExamWrite", policy => policy.RequireClaim("permission", "EXAMEN.WRITE"));
    options.AddPolicy("RequireExamAdminConfig", policy => policy.RequireAssertion(c =>
        c.User.HasClaim("permission", "EXAMEN.WRITE")
        && c.User.HasClaim("permission", "EMPRESA.CONFIG")));
    options.AddPolicy("RequireFiscalRead", policy => policy.RequireClaim("permission", "FISCAL.READ"));
    options.AddPolicy("RequireUserRead", policy => policy.RequireClaim("permission", "USUARIO.READ"));
    options.AddPolicy("RequireUserWrite", policy => policy.RequireClaim("permission", "USUARIO.WRITE"));
    options.AddPolicy("RequireResultadosValidar", policy => policy.RequireClaim("permission", "RESULTADOS.VALIDAR"));
    options.AddPolicy("RequireCajaCerrar", policy => policy.RequireClaim("permission", "CAJA.CERRAR"));
    options.AddPolicy("RequireMuestraGestion", policy => policy.RequireClaim("permission", "MUESTRA.GESTION"));
    options.AddPolicy("RequireEmpresaConfig", policy => policy.RequireClaim("permission", "EMPRESA.CONFIG"));
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHsts();
}

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<NesLabDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    await dbContext.Database.MigrateAsync();
    await DefaultDataSeeder.EnsureDefaultCompanyAsync(dbContext);
    await DatabaseSeeder.SeedAsync(dbContext, passwordHasher);
    await DatabaseSeeder.EnsureDefaultAdminUserIfMissingAsync(dbContext, passwordHasher);
    await FiscalDataSeeder.EnsureAsync(dbContext, builder.Configuration);
    await ModulePermissionSeeder.EnsureAsync(dbContext);
    await PaymentMethodSeeder.EnsureAsync(dbContext);
}

app.UseHttpsRedirection();
app.UseRateLimiter();
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";
    await next();
});
app.UseCors("Frontend");
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<CriticalActionAuditMiddleware>();
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
