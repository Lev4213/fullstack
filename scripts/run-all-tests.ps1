# Run all project tests (Windows PowerShell)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    python -m venv .venv
    .\.venv\Scripts\pip install -r requirements-dev.txt
}

$env:DATABASE_URL = "sqlite+aiosqlite:///:memory:"
$env:TESTING = "1"

Write-Host "=== Backend pytest ===" -ForegroundColor Cyan
& .\.venv\Scripts\python.exe -m pytest -q
if (-not $?) { exit 1 }

Write-Host "=== Frontend Vitest ===" -ForegroundColor Cyan
Push-Location frontend
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "npm install..." -ForegroundColor Yellow
        npm install
        if (-not $?) { exit 1 }
    }
    $env:CI = "true"
    npm run test
    if (-not $?) { exit 1 }
}
finally {
    Pop-Location
}

Write-Host "=== Done ===" -ForegroundColor Green
