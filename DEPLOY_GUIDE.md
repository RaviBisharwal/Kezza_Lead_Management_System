# 🚀 Live Link Deploy Guide — Render (Free)

## Kya milega?

| Service | URL Format |
|---|---|
| **Backend API** | `https://kezza-backend.onrender.com` |
| **Frontend App** | `https://kezza-frontend.onrender.com` |

---

## Step 1 — GitHub Account Banao

1. Open **[github.com/signup](https://github.com/signup)**
2. Username, Email, Password enter karo
3. Email verify karo
4. GitHub Dashboard par aa jao

---

## Step 2 — GitHub Par Project Upload Karo

### GitHub par naya repository banao

1. GitHub Dashboard par **"+"** → **"New repository"** click karo
2. Repository name: **`kezza-lead-management`**
3. **Private** select karo (recommended)
4. **"Create repository"** click karo

### Terminal mein commands run karo

**Apne laptop par Terminal/Command Prompt kholo aur ek ek command run karo:**

```bash
# Apna naam aur email set karo (ek baar)
git config --global user.name "Tumhara Naam"
git config --global user.email "tumhari@email.com"

# Project folder mein jao
cd "/Users/ravikumar/Desktop/Kezza_Lead_Management_System"

# GitHub remote add karo (apna username replace karo)
git remote add origin https://github.com/TUMHARA_USERNAME/kezza-lead-management.git

# Code push karo
git push -u origin main
```

> **Note:** GitHub login window aayegi — email/password ya Personal Access Token daalo.

**Personal Access Token kaise banaye:**
1. GitHub → Profile → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **"Generate new token"** → Expiration: 90 days → Scope: ✅ **repo** → **Generate**
3. Token copy karo aur password ki jagah paste karo

---

## Step 3 — Free MySQL Database (Aiven)

> Render ka apna MySQL nahi hai — isiliye **Aiven** use karenge (300MB free)

1. **[aiven.io](https://aiven.io)** par account banao (GitHub se login kar sakte ho)
2. **"Create service"** → **MySQL** → Free plan (hobbyist)
3. Cloud: **Google Cloud** ya **AWS** → Region: Asia (Singapore ya Mumbai)
4. **"Create Service"** click karo
5. Service ready hone par (2-3 min) **"Connection information"** copy karo:

```
Host:     mysql-xxxxx.aivencloud.com
Port:     12345
Username: avnadmin
Password: XXXXXXXXXXXX
Database: defaultdb
```

### Database Tables Create Karo

1. Aiven Console → **"Query editor"** tab kholो
2. Neeche diya SQL paste karo aur **"Run"** karo:

```sql
CREATE DATABASE IF NOT EXISTS lead_management_system;
USE lead_management_system;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  keywords TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'disconnected',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  phone VARCHAR(20),
  name VARCHAR(100),
  ad_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  content TEXT,
  direction ENUM('incoming','outgoing') DEFAULT 'incoming',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);
```

---

## Step 4 — Render Account Banao

1. **[render.com](https://render.com)** par jao
2. **"Get Started"** → **GitHub se login karo** (connect GitHub account)

---

## Step 5 — Backend Deploy Karo (Docker)

### 5a. New Web Service

1. Render Dashboard → **"New +"** → **"Web Service"**
2. **"Build and deploy from a Git repository"** → **"Connect"**
3. GitHub repository dhundho: **`kezza-lead-management`** → **"Connect"**

### 5b. Service Settings

| Field | Value |
|---|---|
| **Name** | `kezza-backend` |
| **Region** | Singapore (Asia ke liye) |
| **Branch** | `main` |
| **Runtime** | **Docker** |
| **Dockerfile Path** | `./Whatsapp-Backend/Dockerfile` |
| **Docker Context** | `./Whatsapp-Backend` |
| **Plan** | Free |

### 5c. Environment Variables

**"Environment"** tab mein neeche wali variables add karo:

| Key | Value |
|---|---|
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `DB_HOST` | *Aiven host* (e.g. `mysql-xxx.aivencloud.com`) |
| `DB_PORT` | *Aiven port* (e.g. `12345`) |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | *Aiven password* |
| `DB_NAME` | `lead_management_system` |
| `DB_SSL` | `true` |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/chromium` |
| `WWEBJS_AUTH_PATH` | `./.wwebjs_auth` |
| `WWEBJS_CACHE_PATH` | `./.wwebjs_cache` |

### 5d. Deploy!

**"Create Web Service"** click karo.

> ⏳ Pehla build 5-8 minute leta hai (Chromium download hota hai).

Build complete hone par backend URL milega:
```
https://kezza-backend.onrender.com
```

---

## Step 6 — Frontend Environment Update Karo

Render Backend URL milne ke baad, local machine par ye file update karo:

**File:** `Whatsapp-Frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://kezza-backend.onrender.com',    // ← apna backend URL daalo
  wsUrl:  'wss://kezza-backend.onrender.com'        // ← wss:// (https → wss)
};
```

Phir push karo:
```bash
cd "/Users/ravikumar/Desktop/Kezza_Lead_Management_System"
git add -A
git commit -m "fix: update production backend URL"
git push
```

---

## Step 7 — Frontend Deploy Karo (Angular SSR)

1. Render → **"New +"** → **"Web Service"**
2. Same GitHub repo connect karo
3. Settings:

| Field | Value |
|---|---|
| **Name** | `kezza-frontend` |
| **Region** | Singapore |
| **Branch** | `main` |
| **Runtime** | **Node** |
| **Root Directory** | `Whatsapp-Frontend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run serve:ssr:whatsapp-frontend` |
| **Plan** | Free |

4. **Environment Variables:**

| Key | Value |
|---|---|
| `NODE_VERSION` | `20.18.0` |
| `PORT` | `4000` |

5. **"Create Web Service"** → deploy shuru!

Frontend URL:
```
https://kezza-frontend.onrender.com
```

---

## Step 8 — Test Karo

1. Browser mein kholo: **`https://kezza-frontend.onrender.com`**
2. Register karo / Login karo
3. **"Connect WhatsApp"** click karo
4. QR code scan karo — connected! ✅

---

## ⚠️ Important — Free Plan Limitations

| Issue | Solution |
|---|---|
| **Server sleeps after 15 min** | Upgrade to Starter ($7/mo) ya UptimeRobot se ping karo |
| **WhatsApp session reset** | Free plan mein persistent disk nahi — upgrade karo |
| **Cold start slow** | Pehle request par 30-60 sec lag sakta hai |

### Free Render Sleep Fix (UptimeRobot)

1. **[uptimerobot.com](https://uptimerobot.com)** par free account banao
2. **"Add New Monitor"** → HTTP(s) → URL: `https://kezza-backend.onrender.com`
3. Monitoring interval: **5 minutes**
4. Save → Server ab sona band kar dega!

---

## 🔐 WhatsApp Session Persist Karna (Paid)

Free plan par WhatsApp session reset hota hai agar server restart ho.
Persistent sessions ke liye:

1. Render Dashboard → kezza-backend → **"Disks"** tab
2. **"Add Disk"** → Mount Path: `/data` → 1 GB
3. `.env` mein update karo:
   - `WWEBJS_AUTH_PATH=/data/.wwebjs_auth`
   - `WWEBJS_CACHE_PATH=/data/.wwebjs_cache`

---

## Quick Summary

```
GitHub → Push Code
         ↓
Aiven  → Free MySQL Database
         ↓
Render → Backend  (Docker + Chromium)
Render → Frontend (Angular SSR)
         ↓
Live URLs:
  https://kezza-frontend.onrender.com  ← App
  https://kezza-backend.onrender.com   ← API
```
