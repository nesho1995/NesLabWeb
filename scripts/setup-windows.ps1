param(
  [string]$MySqlHost = "127.0.0.1",
  [int]$MySqlPort = 3306,
  [string]$MySqlAdminUser = "root",
  [string]$MySqlAdminPassword = "",
  [string]$AppDatabase = "neslab",
  [string]$AppDatabaseUser = "neslab",
  [string]$AppDatabasePassword = ""
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$web = Join-Path $repo "src\frontend\apps\web"
$api = Join-Path $repo "src\backend\NesLab.Api"

foreach ($command in @("git", "node", "npm", "dotnet", "mysql")) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    throw "Falta '$command' en PATH. Instale los requisitos indicados en docs/INSTALACION-TECNICA.md."
  }
}

if (-not $AppDatabasePassword) {
  $securePassword = Read-Host "Nueva contrasena para el usuario MySQL '$AppDatabaseUser'" -AsSecureString
  $credential = [System.Net.NetworkCredential]::new("", $securePassword)
  $AppDatabasePassword = $credential.Password
}

$mysqlArgs = @("--host=$MySqlHost", "--port=$MySqlPort", "--user=$MySqlAdminUser")
if ($MySqlAdminPassword) { $mysqlArgs += "--password=$MySqlAdminPassword" }
if ($AppDatabase -notmatch '^[A-Za-z0-9_]+$') {
  throw "El nombre de la base solo puede contener letras, numeros y guion bajo."
}
$escapedDatabase = $AppDatabase
$escapedUser = $AppDatabaseUser.Replace("'", "''")
$escapedPassword = $AppDatabasePassword.Replace("'", "''")
$sql = "CREATE DATABASE IF NOT EXISTS ``$escapedDatabase`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; " +
       "CREATE USER IF NOT EXISTS '$escapedUser'@'localhost' IDENTIFIED BY '$escapedPassword'; " +
       "ALTER USER '$escapedUser'@'localhost' IDENTIFIED BY '$escapedPassword'; " +
       "GRANT ALL PRIVILEGES ON ``$escapedDatabase``.* TO '$escapedUser'@'localhost'; FLUSH PRIVILEGES;"

Write-Host "Preparando base de datos..." -ForegroundColor Cyan
& mysql @mysqlArgs --execute=$sql
if ($LASTEXITCODE -ne 0) { throw "No se pudo preparar MySQL." }

Write-Host "Instalando y compilando frontend..." -ForegroundColor Cyan
Push-Location $web
try {
  npm ci
  if ($LASTEXITCODE -ne 0) { throw "npm ci fallo." }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "La compilacion del frontend fallo." }
} finally { Pop-Location }

Write-Host "Restaurando y compilando backend..." -ForegroundColor Cyan
Push-Location $api
try {
  dotnet restore
  if ($LASTEXITCODE -ne 0) { throw "dotnet restore fallo." }
  dotnet build --no-restore
  if ($LASTEXITCODE -ne 0) { throw "La compilacion del backend fallo." }
} finally { Pop-Location }

Write-Host "Instalacion preparada. Ejecute .\scripts\dev-local.ps1 para abrir NESLAB." -ForegroundColor Green
