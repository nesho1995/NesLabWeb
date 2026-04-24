param(
    [string]$BackupDir = ".\backups",
    [string]$Pattern = "*.sql",
    [int]$MaxAgeHours = 26,
    [string]$WebhookUrl = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupDir)) {
    $msg = "Directorio de backup no existe: $BackupDir"
    Write-Error $msg
    if ($WebhookUrl) {
        & "$PSScriptRoot\send-alert-webhook.ps1" -WebhookUrl $WebhookUrl -Title "Backup faltante" -Message $msg -Severity "critical"
    }
    exit 2
}

$latest = Get-ChildItem -Path $BackupDir -Filter $Pattern | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $latest) {
    $msg = "No hay archivos de backup con patron $Pattern en $BackupDir"
    Write-Error $msg
    if ($WebhookUrl) {
        & "$PSScriptRoot\send-alert-webhook.ps1" -WebhookUrl $WebhookUrl -Title "Backup no encontrado" -Message $msg -Severity "critical"
    }
    exit 3
}

$age = (New-TimeSpan -Start $latest.LastWriteTime -End (Get-Date)).TotalHours
if ($age -gt $MaxAgeHours) {
    $msg = "Backup desactualizado. Ultimo=$($latest.Name), antiguedad={0:N1}h (max={1}h)." -f $age, $MaxAgeHours
    Write-Warning $msg
    if ($WebhookUrl) {
        & "$PSScriptRoot\send-alert-webhook.ps1" -WebhookUrl $WebhookUrl -Title "Backup vencido" -Message $msg -Severity "critical"
    }
    exit 1
}

Write-Host "Backup OK: $($latest.Name) edad={0:N1}h" -f $age
exit 0
