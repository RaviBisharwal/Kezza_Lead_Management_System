# Kezza Lead Management System - Windows PowerShell Launcher
# Run with:  Right-click -> "Run with PowerShell"
# Or from PowerShell terminal:  .\start-windows.ps1

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "Kezza Lead Management System"

function Write-Header($text) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

function Write-OK($text)      { Write-Host "[OK]      $text" -ForegroundColor Green }
function Write-Warn($text)    { Write-Host "[WARNING] $text" -ForegroundColor Yellow }
function Write-Fail($text)    { Write-Host "[ERROR]   $text" -ForegroundColor Red }
function Write-Info($text)    { Write-Host "[INFO]    $text" -ForegroundColor White }

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Header "Kezza Lead Management System - Windows Setup"

# ── 1. Node.js ──────────────────────────────────────────────────────────────
Write-Header "Checking Prerequisites"

$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Fail "Node.js is NOT installed."
    Write-Info "Download LTS from: https://nodejs.org"
    Read-Host "Press Enter to exit"
    exit 1
}
$nodeVer = & node -v
Write-OK "Node.js found: $nodeVer"

# ── 2. MySQL ─────────────────────────────────────────────────────────────────
$mysqlCheck = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCheck) {
    Write-Warn "MySQL CLI not found. Install from https://dev.mysql.com/downloads/installer/"
    Write-Info "You can still continue if MySQL is running as a Windows Service."
} else {
    Write-OK "MySQL CLI found."
}

# ── 3. Chrome ────────────────────────────────────────────────────────────────
$chromeCandidates = @(
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Chromium\Application\chrome.exe",
    "C:\Program Files\Chromium\Application\chrome.exe",
    "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\Application\brave.exe",
    "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

$chromePath = $null
foreach ($c in $chromeCandidates) {
    if (Test-Path $c) {
        $chromePath = $c
        Write-OK "Browser found: $chromePath"
        break
    }
}
if (-not $chromePath) {
    Write-Warn "No Chrome/Chromium found. Install Google Chrome from https://www.google.com/chrome/"
    Write-Info "Or set PUPPETEER_EXECUTABLE_PATH manually in Whatsapp-Backend\.env"
}

# ── 4. Database setup ────────────────────────────────────────────────────────
Write-Header "Setting up MySQL Database"
$schemaFile = Join-Path $root "Whatsapp-Backend\schema.sql"
if (Test-Path $schemaFile) {
    if ($mysqlCheck) {
        try {
            & mysql -u root --execute "source $schemaFile" 2>&1 | Out-Null
            & mysql -u root < $schemaFile 2>&1 | Out-Null
            Write-OK "Database schema applied."
        } catch {
            Write-Warn "Auto-schema failed. Run manually:"
            Write-Info "  mysql -u root -p < Whatsapp-Backend\schema.sql"
        }
    } else {
        Write-Warn "Skipping DB setup (MySQL not in PATH). Run schema.sql manually."
    }
} else {
    Write-Warn "schema.sql not found."
}

# ── 5. .env setup ────────────────────────────────────────────────────────────
Write-Header "Configuring Backend .env"
$envFile = Join-Path $root "Whatsapp-Backend\.env"
if (-not (Test-Path $envFile)) {
    $chromeLine = if ($chromePath) { "PUPPETEER_EXECUTABLE_PATH=$chromePath" } else { "# PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe" }
    $envContent = @"
# Server Configuration
PORT=3000

# Database Configuration (MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lead_management_system
DB_PORT=3306
DB_CONNECTION_LIMIT=10
DB_SSL=false

# Google Sheets Configuration
GOOGLE_APPLICATION_CREDENTIALS=credentials.json

# WhatsApp Web Session Path
WWEBJS_AUTH_PATH=./.wwebjs_auth

# Puppeteer Chrome Executable Path (Windows)
$chromeLine
"@
    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Write-OK ".env created at: $envFile"
} else {
    Write-OK ".env already exists - skipping."
}

# ── 6. npm install ───────────────────────────────────────────────────────────
Write-Header "Installing Backend Dependencies"
Push-Location (Join-Path $root "Whatsapp-Backend")
& npm install
Pop-Location
Write-OK "Backend dependencies installed."

Write-Header "Installing Frontend Dependencies"
Push-Location (Join-Path $root "Whatsapp-Frontend")
& npm install
# Fix optional rollup binding for Windows
& npm install --save-optional @rollup/rollup-win32-x64-msvc 2>&1 | Out-Null
& npm install --save-optional @rollup/rollup-win32-arm64-msvc 2>&1 | Out-Null
Pop-Location
Write-OK "Frontend dependencies installed."

# ── 7. Start both servers ────────────────────────────────────────────────────
Write-Header "Starting Servers"
Write-Info "Backend  -> http://localhost:3000"
Write-Info "Frontend -> http://localhost:4200"
Write-Host ""

$backendDir  = Join-Path $root "Whatsapp-Backend"
$frontendDir = Join-Path $root "Whatsapp-Frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; npm start" -WindowStyle Normal
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm start" -WindowStyle Normal
Start-Sleep -Seconds 6

Start-Process "http://localhost:4200"

Write-OK "Both servers launched in separate PowerShell windows."
Write-Info "Close those windows to stop the servers."
Write-Host ""
Read-Host "Press Enter to close this window"
