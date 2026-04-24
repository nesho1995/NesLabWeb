param(
    [Parameter(Mandatory = $true)][string]$WebhookUrl,
    [Parameter(Mandatory = $true)][string]$Title,
    [Parameter(Mandatory = $true)][string]$Message,
    [ValidateSet("info", "warning", "critical")][string]$Severity = "warning"
)

$ErrorActionPreference = "Stop"

$payload = @{
    timestampUtc = (Get-Date).ToUniversalTime().ToString("o")
    severity = $Severity
    title = $Title
    message = $Message
    source = "NesLabWeb-Ops"
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Uri $WebhookUrl -Method Post -ContentType "application/json" -Body $payload | Out-Null
Write-Host "Alerta enviada [$Severity]: $Title"
