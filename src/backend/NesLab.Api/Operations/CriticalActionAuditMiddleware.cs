using System.Diagnostics;
using NesLab.Application.Abstractions;
using NesLab.Application.Interfaces;

namespace NesLab.Api.Operations;

public sealed class CriticalActionAuditMiddleware(
    RequestDelegate next)
{
    private static readonly HashSet<string> Methods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Post,
        HttpMethods.Put,
        HttpMethods.Patch,
        HttpMethods.Delete
    };

    public async Task InvokeAsync(
        HttpContext context,
        ICriticalActionLogWriter writer,
        ICurrentUserContext userContext,
        ITenantContext tenantContext)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var method = context.Request.Method;
        var shouldCapture = Methods.Contains(method) && path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase);
        if (!shouldCapture)
        {
            await next(context);
            return;
        }

        var sw = Stopwatch.StartNew();
        try
        {
            await next(context);
        }
        finally
        {
            sw.Stop();
            var entry = new CriticalActionLogEntry(
                DateTime.UtcNow,
                tenantContext.CompanyId,
                userContext.UserId,
                method,
                path,
                context.Request.QueryString.Value ?? string.Empty,
                context.Response.StatusCode,
                sw.ElapsedMilliseconds,
                context.Connection.RemoteIpAddress?.ToString(),
                context.Request.Headers.UserAgent.ToString());

            await writer.WriteAsync(entry, context.RequestAborted);
        }
    }
}
