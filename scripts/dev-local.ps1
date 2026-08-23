param(
  [string]$ConnectionString = $env:ConnectionStrings__MySql
)

# Compila el frontend y ejecuta web + API en http://localhost:5225.

$ErrorActionPreference = "Stop"
$neslabWeb = Split-Path -Parent $PSScriptRoot
$api = Join-Path $neslabWeb "src\backend\NesLab.Api"
$web = Join-Path $neslabWeb "src\frontend\apps\web"

if (-not (Test-Path (Join-Path $api "NesLab.Api.csproj"))) {
  throw "No se encontro NesLab.Api.csproj. Verifique que el repositorio este completo."
}

foreach ($command in @("node", "npm", "dotnet")) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    throw "Falta '$command' en PATH. Consulte docs/INSTALACION-TECNICA.md."
  }
}

if (-not $ConnectionString) {
  $securePassword = Read-Host "Contrasena del usuario MySQL 'neslab'" -AsSecureString
  $credential = [System.Net.NetworkCredential]::new("", $securePassword)
  $builder = [System.Data.Common.DbConnectionStringBuilder]::new()
  $builder["Server"] = "127.0.0.1"
  $builder["Port"] = 3306
  $builder["Database"] = "neslab"
  $builder["User"] = "neslab"
  $builder["Password"] = $credential.Password
  $builder["SslMode"] = "None"
  $builder["AllowPublicKeyRetrieval"] = $true
  $ConnectionString = $builder.ConnectionString
}

Write-Host "Compilando front hacia $api\wwwroot ..." -ForegroundColor Cyan
Set-Location -LiteralPath $web
npm ci
npm run build

if ($LASTEXITCODE -ne 0) { throw "No se pudo compilar el frontend." }

Write-Host "Iniciando API (tambien sirve el React en http://localhost:5225) ..." -ForegroundColor Green
Set-Location -LiteralPath $api
$env:ConnectionStrings__MySql = $ConnectionString
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet restore
if ($LASTEXITCODE -ne 0) { throw "No se pudieron restaurar los paquetes .NET." }
dotnet run --launch-profile http

