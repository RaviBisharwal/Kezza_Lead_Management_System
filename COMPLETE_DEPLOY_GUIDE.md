# 🚀 Complete Deployment Guide — Kezza Lead Management System
### (Render + GoDaddy + Free Database)

---

## 📋 Overview — Kya Karna Hai

```
STEP 1 → Free MySQL Database banao (Aiven.io)
STEP 2 → Backend Render par deploy karo (Docker)
STEP 3 → Frontend GoDaddy par upload karo (Static Files)
STEP 4 → GoDaddy Domain → Render se connect karo
STEP 5 → UptimeRobot se backend 24/7 awake rakho
```

---

# STEP 1 — Free MySQL Database (Aiven.io)

> **Kyun Aiven?** — 100% free MySQL, no credit card, Render ke saath best compatibility

### 1.1 Account Banao
1. Jao: **[console.aiven.io](https://console.aiven.io)**
2. **Sign Up** karo (Google se bhi ho sakta hai)

### 1.2 MySQL Service Create Karo
1. **Create Service** click karo
2. Service type: **MySQL**
3. Cloud provider: **AWS** ya **Google Cloud**
4. Region: **ap-south-1** (Mumbai — India ke liye fast)
5. Plan: **Free** (Hobbyist)
6. Service name: `kezza-mysql`
7. **Create Service** click karo
8. ⏳ 2-3 minute wait karo — green "Running" dikhega

### 1.3 Database Credentials Note Karo
Service ke andar jao → **Overview** tab:

```
Host:     mysql-xxxx.aivencloud.com
Port:     XXXXX  (custom port, 20000+ range)
User:     avnadmin
Password: xxxxxxxxxx  (copy karke safe rakh)
Database: defaultdb
SSL:      required
```

### 1.4 Database aur Tables Banao
1. Aiven Console → **Databases** tab → **Add Database**
2. Name: `lead_management_system` → **Add**
3. Ab **Query Editor** tab mein jao
4. Niche diya hua SQL paste karo aur **Run** karo:

```sql
USE lead_management_system;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    centre VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ad_name VARCHAR(255) NOT NULL,
    keyword VARCHAR(255) UNIQUE,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255) UNIQUE,
    phone_number VARCHAR(50),
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_recovery_at DATETIME NULL,
    INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT,
    whatsapp_id VARCHAR(255),
    phone VARCHAR(50),
    name VARCHAR(255),
    unique_key VARCHAR(255),
    ad_id INT NULL,
    UNIQUE KEY unique_account_contact (account_id, unique_key),
    INDEX idx_account_id (account_id),
    INDEX idx_ad_id (ad_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT,
    account_id INT,
    whatsapp_message_id VARCHAR(255) UNIQUE,
    message TEXT,
    direction VARCHAR(20),
    is_group BOOLEAN DEFAULT FALSE,
    group_name VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contact_id (contact_id),
    INDEX idx_account_id (account_id)
);
```

✅ **Database ready!**

---

# STEP 2 — Backend Render Par Deploy Karo

### 2.1 GitHub Par Code Push Karo (Already Done ✅)
Agar push nahi hua to:
```bash
cd /Users/ravikumar/Desktop/Kezza_Lead_Management_System
git add .
git commit -m "ready for deploy"
git push origin main
```

### 2.2 Render Account Banao
1. Jao: **[render.com](https://render.com)**
2. **Get Started for Free** → GitHub se Sign Up karo
3. GitHub account authorize karo

### 2.3 Backend Web Service Create Karo
1. Dashboard mein **New +** → **Web Service** click karo
2. **Build and deploy from a Git repository** select karo
3. **Connect** karo: `RaviBisharwal/Kezza_Lead_Management_System`
4. Yeh settings bharo:

| Field | Value |
|---|---|
| **Name** | `kezza-backend` |
| **Root Directory** | `Whatsapp-Backend` |
| **Runtime** | **Docker** |
| **Region** | Singapore (India ke liye closest) |
| **Instance Type** | Free |

5. **Environment Variables** section mein yeh sab add karo:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DB_HOST` | `mysql-xxxx.aivencloud.com` ← Aiven se copy karo |
| `DB_PORT` | `XXXXX` ← Aiven port |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | `xxxxxxxxxx` ← Aiven password |
| `DB_NAME` | `lead_management_system` |
| `DB_SSL` | `true` |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/chromium` |
| `WWEBJS_AUTH_PATH` | `./.wwebjs_auth` |
| `GOOGLE_CREDENTIALS_JSON` | *(credentials.json ka poora content paste karo)* |

6. **Create Web Service** click karo
7. ⏳ 5-10 minute wait karo — Docker build hoga
8. ✅ Green "Live" dikhega + URL milega:
   `https://kezza-backend.onrender.com`

> **GOOGLE_CREDENTIALS_JSON kaise add karein?**
> Terminal mein yeh run karo:
> ```bash
> cat /Users/ravikumar/Desktop/Kezza_Lead_Management_System/Whatsapp-Backend/credentials.json
> ```
> Poora output copy karo aur Render mein paste karo.

### 2.4 Backend Test Karo
Browser mein kholo: `https://kezza-backend.onrender.com`
✅ "Server Running" jaisa message aana chahiye

---

# STEP 3 — Frontend GoDaddy Par Upload Karo

### 3.1 Build Already Ready Hai ✅
Files yahan hain:
```
Whatsapp-Frontend/dist/whatsapp-frontend/browser/
```

### 3.2 environment.prod.ts Update Karo
Agar aapka Render backend URL alag hai to update karo:

File: `Whatsapp-Frontend/src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://kezza-backend.onrender.com',   // ← apna Render URL
  wsUrl: 'wss://kezza-backend.onrender.com'        // ← wss:// use karo
};
```

Phir rebuild karo:
```bash
cd /Users/ravikumar/Desktop/Kezza_Lead_Management_System/Whatsapp-Frontend
npm run build
```

### 3.3 GoDaddy Hosting Setup
1. **[godaddy.com](https://godaddy.com)** → Web Hosting kharido (Economy plan ~₹99/month)
2. Domain se connect karo setup ke waqt
3. Email aayega with cPanel login details

### 3.4 Files Upload Karo (cPanel File Manager)
1. GoDaddy → **My Products** → **Web Hosting** → **Manage**
2. **cPanel** open karo
3. **File Manager** click karo
4. `public_html/` folder mein jao
5. Sab existing files **delete** karo (right-click → Delete)
6. **Upload** button click karo
7. Yeh sab files upload karo `browser/` folder se:
   - `index.csr.html`
   - `main-XXXXX.js`
   - `styles-XXXXX.css`
   - `favicon.ico`
   - `.htaccess` ← **zaroor upload karo**
   - Sare subfolder bhi (contacts/, dashboard/, login/, profile/, register/)

> **Tip:** FTP use karo agar files zyada hain — FileZilla app download karo (free).
> FTP credentials cPanel mein milenge → **FTP Accounts** section mein.

### 3.5 .htaccess File Check Karo
`public_html/` mein `.htaccess` file honi chahiye with content:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

---

# STEP 4 — GoDaddy Domain → Render Backend Se Connect Karo

### 4.1 Custom Domain Render Par Add Karo
1. Render Dashboard → **kezza-backend** service
2. **Settings** tab → **Custom Domains** section
3. **Add Custom Domain** click karo
4. Type: `api.yourdomain.com` (subdomain use karo backend ke liye)
5. Render aapko ek **CNAME value** dega — copy karo

### 4.2 GoDaddy DNS Mein Records Add Karo
1. GoDaddy → **My Products** → Domain ke side mein **DNS** click karo
2. **Add New Record** → yeh records add karo:

**Frontend ke liye (A Record):**
| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | *cPanel server IP* | 600 sec |
| CNAME | www | @ | 1 Hour |

> cPanel server IP kahan milega? cPanel login → upar right side mein **Shared IP Address** dikhega.

**Backend ke liye (CNAME Record):**
| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | api | `kezza-backend.onrender.com` | 600 sec |

3. **Save** karo
4. ⏳ 24-48 hours mein DNS propagate ho jaata hai (usually 1-2 hours mein)

### 4.3 DNS Propagation Check Karo
Website: **[dnschecker.org](https://dnschecker.org)**
Type karo: `api.yourdomain.com` → green ticks aane chahiye

---

# STEP 5 — UptimeRobot Se Backend 24/7 Awake Rakho (Free)

Render free tier 15 min baad sleep ho jata hai. UptimeRobot har 5 min mein ping karega.

### 5.1 Account Banao
1. Jao: **[uptimerobot.com](https://uptimerobot.com)**
2. **Register for FREE** → email se signup

### 5.2 Monitor Add Karo
1. Dashboard → **+ Add New Monitor**
2. Settings:

| Field | Value |
|---|---|
| **Monitor Type** | HTTP(s) |
| **Friendly Name** | Kezza Backend |
| **URL** | `https://kezza-backend.onrender.com` |
| **Monitoring Interval** | Every 5 minutes |

3. **Create Monitor** click karo

✅ Ab aapka backend kabhi sleep nahi karega!

---

# ✅ Final Checklist

| Task | Status |
|---|---|
| Aiven MySQL database create ✅ | ⬜ |
| Schema.sql tables create ✅ | ⬜ |
| Render backend deploy ✅ | ⬜ |
| Render env variables set ✅ | ⬜ |
| Angular frontend build ✅ | ⬜ |
| GoDaddy hosting par files upload ✅ | ⬜ |
| GoDaddy DNS records set ✅ | ⬜ |
| UptimeRobot monitor setup ✅ | ⬜ |

---

# 💰 Total Cost

| Service | Cost |
|---|---|
| GoDaddy Domain | ~₹800-1500/year |
| GoDaddy Shared Hosting | ~₹99-299/month |
| Render Backend | **FREE** |
| Aiven MySQL Database | **FREE** |
| UptimeRobot | **FREE** |
| **Total** | **~₹200-400/month** |

---

# 🆘 Common Problems & Solutions

| Problem | Solution |
|---|---|
| Render build fail | Check logs in Render dashboard → Logs tab |
| 404 on page refresh | `.htaccess` file missing ya galat — re-upload karo |
| Backend not connecting | Check Render env variables — DB_HOST, DB_PASSWORD sahi hai? |
| WhatsApp QR nahi aa raha | Render logs check karo — Chromium issue ho sakta hai |
| CORS error | Backend mein `yourdomain.com` allowed origins mein add karo |
| DNS nahi chal raha | Wait 24-48 hours, ya dnschecker.org se check karo |
