# Windows Setup Guide — Kezza Lead Management System

This guide walks you through running the Kezza Lead Management System on **Windows 10 / Windows 11**.

---

## Prerequisites

Install the following before running the setup script:

| Requirement | Download | Notes |
|---|---|---|
| **Node.js** (v18+) | [nodejs.org](https://nodejs.org) | Choose LTS version |
| **MySQL 8** | [MySQL Installer](https://dev.mysql.com/downloads/installer/) | Install "MySQL Server" + "MySQL Shell" |
| **Google Chrome** | [google.com/chrome](https://www.google.com/chrome/) | Used by WhatsApp Web automation |
| **Git** *(optional)* | [git-scm.com](https://git-scm.com) | For cloning this repo |

> **IMPORTANT — MySQL PATH**: During MySQL installation, check **"Add to System PATH"**. If you miss this, add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to your system PATH manually.

---

## Quick Start (Recommended)

### Option A — PowerShell (Best)

1. Right-click `start-windows.ps1` → **Run with PowerShell**
2. If blocked, open PowerShell as Administrator and run:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\start-windows.ps1
   ```

The script will:
- ✅ Check Node.js, MySQL, Chrome
- ✅ Create the database and tables
- ✅ Create `Whatsapp-Backend\.env` with your Chrome path
- ✅ Run `npm install` for both backend and frontend
- ✅ Open both servers in separate PowerShell windows
- ✅ Open `http://localhost:4200` in your browser

---

### Option B — Batch Script

1. Double-click **`start-windows.bat`**
2. Follow the on-screen instructions

---

### Option C — Manual Setup

**Step 1: Create the database**
```cmd
mysql -u root -p < Whatsapp-Backend\schema.sql
```

**Step 2: Create `.env`**

Copy `Whatsapp-Backend\.env.example` to `Whatsapp-Backend\.env` and fill in:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lead_management_system
DB_PORT=3306
DB_SSL=false

GOOGLE_APPLICATION_CREDENTIALS=credentials.json

# Set this to your Chrome path:
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

**Step 3: Install dependencies**
```cmd
cd Whatsapp-Backend
npm install
cd ..\Whatsapp-Frontend
npm install
```

**Step 4: Start servers** (in two separate Command Prompt / PowerShell windows)

*Window 1 — Backend:*
```cmd
cd Whatsapp-Backend
npm start
```

*Window 2 — Frontend:*
```cmd
cd Whatsapp-Frontend
npm start
```

**Step 5: Open browser**
```
http://localhost:4200
```

---

## Windows Chrome Path Reference

The system auto-detects Chrome. If detection fails, set the path manually in `.env`:

| Browser | Typical Windows Path |
|---|---|
| Google Chrome | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| Google Chrome (x86) | `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe` |
| Chromium | `C:\Program Files\Chromium\Application\chrome.exe` |
| Brave Browser | `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe` |
| Microsoft Edge | `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` |

To find your Chrome path, run in PowerShell:
```powershell
(Get-Item (Get-Command chrome -ErrorAction SilentlyContinue).Source).FullName
```

---

## Common Windows Issues

### ❌ `EADDRINUSE: address already in use :::3000`
Another process is using port 3000. Find and kill it:
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### ❌ `PUPPETEER_EXECUTABLE_PATH` not found
1. Make sure Chrome is installed
2. Set the full path in `.env`:
   ```
   PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
   ```

### ❌ `Access denied` MySQL error
Your MySQL root user may require a password. Update `.env`:
```
DB_PASSWORD=your_password_here
```
Or open MySQL Workbench and reset the root password.

### ❌ `npm install` fails with `@rollup/rollup-win32-x64-msvc` error
Run:
```cmd
cd Whatsapp-Frontend
npm install --save-optional @rollup/rollup-win32-x64-msvc
npm install --save-optional @rollup/rollup-win32-arm64-msvc
npm start
```

### ❌ PowerShell script blocked (`cannot be loaded because running scripts is disabled`)
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ WhatsApp QR takes long to load
- This is normal on first launch — Chrome needs 15–30 seconds to boot
- The dashboard shows a spinner with a progress message while loading
- On subsequent runs, the session is cached so startup is faster

---

## Firewall / Windows Defender

Windows may prompt you to allow Node.js through the firewall when you first start the backend. Click **"Allow access"** so the frontend can reach the backend on port 3000.

---

## Stopping the Servers

Simply close the two terminal windows (Backend and Frontend). No data is lost — the MySQL database persists.

---

## Production on Windows

For a production Windows server, consider using **[PM2](https://pm2.keymetrics.io/)** to keep both services running:

```cmd
npm install -g pm2
cd Whatsapp-Backend
pm2 start src/app.js --name kezza-backend
cd ..\Whatsapp-Frontend
pm2 start npm --name kezza-frontend -- start
pm2 save
pm2 startup
```

This runs both services as background processes that survive reboots.
