param(
    [string]$ApiBaseUrl = "https://localhost:7104",
    [int]$TimeoutSec = 8,
    [int]$LatencyWarnMs = 2500,
    [string]$WebhookUrl = ""
)

$ErrorActionPreference = "Stop"
$healthUrl = "$ApiBaseUrl/api/ops/health"

try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec $TimeoutSec -SkipCertificateCheck
    $sw.Stop()

    $latency = [int]$sw.ElapsedMilliseconds
    if ($response.status -ne "ok" -or $response.db -ne "up") {
        $msg = "Health degradado. status=$($response.status), db=$($response.db), latencyMs=$latency."
        Write-Warning $msg
        if ($WebhookUrl) {
            & "$PSScriptRoot\send-alert-webhook.ps1" -WebhookUrl $WebhookUrl -Title "NesLab health degradado" -Message $msg -Severity "critical"
        }
        exit 2
    }

    if ($latency -gt $LatencyWarnMs) {
        $msg = "Health OK pero latencia alta: ${latency}ms (umbral=${LatencyWarnMs}ms)."
        Write-Warning $msg
        if ($WebhookUrl) {
            & "$PSScriptRoot\send-alert-webhook.ps1" -WebhookUrl $WebhookUrl -Title "NesLab latencia alta" -Message $msg -Severity "warning"
        }
        exit 1
    }

    Write-Host "Health OK. db=up latency=${latency}ms"
    exit 0
}
catch {
    $msg = "Health check fallo: $($_.Exception.Message)"
    Write-Error $msg
    if ($WebhookUrl) {
        & "$PSScriptRoot\send-alert-webhook.ps1" -WebhookUrl $WebhookUrl -Title "NesLab API caida" -Message $msg -Severity "critical"
    }
    exit 3
}
