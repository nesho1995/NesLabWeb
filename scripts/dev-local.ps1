# Uso: desde la carpeta NesLabWeb, .\scripts\dev-local.ps1
# 1) npm run build (Vite empaqueta a NesLab.Api/wwwroot; sin servidor Vite)
# 2) dotnet run en NesLab.Api: un solo origen en http://localhost:5225 (web + /api)

$ErrorActionPreference = "Stop"
$neslabWeb = Split-Path -Parent $PSScriptRoot
$api = Join-Path $neslabWeb "src\backend\NesLab.Api"
$web = Join-Path $neslabWeb "src\frontend\apps\web"

if (-not (Test-Path (Join-Path $api "NesLab.Api.csproj"))) {
  Write-Error "Ejecute desde el repo: carpeta NesLabWeb\scripts"
}

Write-Host "Compilando front hacia $api\wwwroot ..." -ForegroundColor Cyan
Set-Location -LiteralPath $web
if (-not (Test-Path "node_modules")) {
  npm install
}
npm run build

Write-Host "Iniciando API (tambien sirve el React en http://localhost:5225) ..." -ForegroundColor Green
Set-Location -LiteralPath $api
dotnet run --launch-profile http
