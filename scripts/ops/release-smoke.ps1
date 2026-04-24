param(
    [string]$ApiBaseUrl = "https://localhost:7104"
)

$ErrorActionPreference = "Stop"

Write-Host "== Smoke release NesLabWeb =="

function Invoke-GetOrFail([string]$url, [int]$expectedCode = 200) {
    try {
        $res = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -SkipCertificateCheck
        if ($res.StatusCode -ne $expectedCode) {
            throw "Codigo inesperado $($res.StatusCode) para $url"
        }
        Write-Host "[OK] $url ($($res.StatusCode))"
    }
    catch {
        throw "[FAIL] $url :: $($_.Exception.Message)"
    }
}

Invoke-GetOrFail "$ApiBaseUrl/api/ops/health"
Invoke-GetOrFail "$ApiBaseUrl/"

Write-Host "Smoke baseline completado."
Write-Host "Pendiente manual: login, crear orden, abrir/cerrar caja, validar resultado, sync offline."
