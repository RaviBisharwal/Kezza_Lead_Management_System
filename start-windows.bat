@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo ============================================================
echo   Kezza Lead Management System - Windows Setup ^& Launcher
echo ============================================================
echo.

REM ---------- Check Node.js ----------
where node >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERROR] Node.js is NOT installed.
    echo         Download it from https://nodejs.org  (LTS version)
    pause
    exit /b 1
)
FOR /F "tokens=*" %%V IN ('node -v') DO SET NODE_VER=%%V
echo [OK] Node.js found: %NODE_VER%

REM ---------- Check npm ----------
where npm >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERROR] npm not found. Reinstall Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] npm found.

REM ---------- Check MySQL ----------
where mysql >nul 2>&1
IF ERRORLEVEL 1 (
    echo [WARNING] MySQL CLI not found in PATH.
    echo           Install MySQL from https://dev.mysql.com/downloads/installer/
    echo           and make sure it is added to your system PATH.
    echo.
    echo           You can still continue if MySQL is running as a service.
) ELSE (
    echo [OK] MySQL CLI found.
)

REM ---------- Check Chrome ----------
SET CHROME_FOUND=0
SET CHROME_PATH=

IF EXIST "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    SET CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe
    SET CHROME_FOUND=1
)
IF !CHROME_FOUND!==0 IF EXIST "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    SET CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
    SET CHROME_FOUND=1
)
IF !CHROME_FOUND!==0 IF EXIST "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    SET CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
    SET CHROME_FOUND=1
)
IF !CHROME_FOUND!==0 IF EXIST "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    SET CHROME_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
    SET CHROME_FOUND=1
)

IF !CHROME_FOUND!==1 (
    echo [OK] Browser found: !CHROME_PATH!
) ELSE (
    echo [WARNING] Google Chrome not found.
    echo           Install from https://www.google.com/chrome/
    echo           Or set PUPPETEER_EXECUTABLE_PATH in Whatsapp-Backend\.env
)

echo.
echo ============================================================
echo   Step 1: Setting up Database
echo ============================================================

mysql -u root < Whatsapp-Backend\schema.sql 2>nul
IF ERRORLEVEL 1 (
    echo [WARNING] Could not auto-run schema.sql.
    echo           Open MySQL Workbench or run manually:
    echo             mysql -u root -p ^< Whatsapp-Backend\schema.sql
) ELSE (
    echo [OK] Database schema applied.
)

echo.
echo ============================================================
echo   Step 2: Installing Backend dependencies
echo ============================================================
cd Whatsapp-Backend
npm install
cd ..

echo.
echo ============================================================
echo   Step 3: Installing Frontend dependencies
echo ============================================================
cd Whatsapp-Frontend
npm install
IF ERRORLEVEL 1 (
    echo [INFO] Trying to fix optional dependency issue...
    npm install --save-optional @rollup/rollup-win32-x64-msvc
    npm install --save-optional @rollup/rollup-win32-arm64-msvc
)
cd ..

echo.
echo ============================================================
echo   Step 4: Configuring .env for Windows
echo ============================================================

IF NOT EXIST "Whatsapp-Backend\.env" (
    echo Creating Whatsapp-Backend\.env ...
    (
        echo # Server Configuration
        echo PORT=3000
        echo.
        echo # Database Configuration (MySQL^)
        echo DB_HOST=localhost
        echo DB_USER=root
        echo DB_PASSWORD=
        echo DB_NAME=lead_management_system
        echo DB_PORT=3306
        echo DB_CONNECTION_LIMIT=10
        echo DB_SSL=false
        echo.
        echo # Google Sheets Configuration
        echo GOOGLE_APPLICATION_CREDENTIALS=credentials.json
        echo.
        echo # WhatsApp Web Session Path
        echo WWEBJS_AUTH_PATH=./.wwebjs_auth
        echo.
        echo # Puppeteer Chrome Executable Path (Windows^)
        echo PUPPETEER_EXECUTABLE_PATH=!CHROME_PATH!
    ) > Whatsapp-Backend\.env
    echo [OK] .env created with Chrome path: !CHROME_PATH!
) ELSE (
    echo [OK] .env already exists - skipping.
)

echo.
echo ============================================================
echo   All done! Starting servers...
echo ============================================================
echo.
echo   Backend  -> http://localhost:3000
echo   Frontend -> http://localhost:4200
echo.
echo   Opening both servers in separate windows...
echo.

start "Kezza Backend" cmd /k "cd Whatsapp-Backend && npm start"
timeout /t 3 /nobreak >nul
start "Kezza Frontend" cmd /k "cd Whatsapp-Frontend && npm start"
timeout /t 5 /nobreak >nul
start http://localhost:4200

echo.
echo   Both servers are running in their own windows.
echo   Close those windows to stop the servers.
echo.
pause
