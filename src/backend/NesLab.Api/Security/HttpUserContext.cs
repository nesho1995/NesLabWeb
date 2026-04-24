using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using NesLab.Application.Abstractions;

namespace NesLab.Api.Security;

public sealed class HttpUserContext(IHttpContextAccessor http) : ICurrentUserContext
{
    public int? UserId
    {
        get
        {
            var s = http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? http.HttpContext?.User.FindFirstValue("sub");
            return int.TryParse(s, out var u) ? u : null;
        }
    }
}
