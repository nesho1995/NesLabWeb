param(
    [string]$MySqlDumpPath = "mysqldump",
    [string]$Host = "localhost",
    [int]$Port = 3306,
    [string]$Database = "neslab",
    [string]$User = "root",
    [string]$Password = "",
    [string]$OutputDir = ".\backups",
    [int]$KeepDays = 14
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $OutputDir "$($Database)_$timestamp.sql"

$env:MYSQL_PWD = $Password
try {
    & $MySqlDumpPath --host=$Host --port=$Port --user=$User --single-transaction --routines --triggers $Database > $backupFile
}
finally {
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}

if (-not (Test-Path $backupFile)) {
    throw "No se pudo generar backup: $backupFile"
}

$limit = (Get-Date).AddDays(-$KeepDays)
Get-ChildItem -Path $OutputDir -Filter "$($Database)_*.sql" |
    Where-Object { $_.LastWriteTime -lt $limit } |
    Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Backup generado: $backupFile"
