# @riligar/elysia-backup

[![Open Source](https://img.shields.io/badge/Open%20Source-RiLiGar-blue)](https://riligar.click/)
[![npm version](https://img.shields.io/npm/v/@riligar/elysia-backup.svg)](https://www.npmjs.com/package/@riligar/elysia-backup)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **An open source project by [RiLiGar](https://riligar.click/)**

A powerful Elysia plugin for R2/S3 backup with a beautiful built-in UI dashboard. Designed for Bun runtime with native S3 client for optimal performance.

## ✨ Features

-   📁 **Smart Backup** — Backup local directories to R2/S3 with file filtering
-   🔄 **Scheduled Backups** — Cron-based automatic backups
-   🖥️ **Beautiful Dashboard** — Modern UI with real-time status
-   🔐 **Secure Authentication** — Session-based auth with 2FA/TOTP support
-   🧭 **Guided Onboarding** — Multi-step setup wizard for first-time configuration
-   ⬇️ **One-Click Restore** — Easily restore files from backup
-   🗑️ **Backup Management** — Delete old backups from the UI
-   ⚙️ **Runtime Configuration** — Update settings without restarting

## 📦 Installation

```bash
bun add @riligar/elysia-backup
```

### Peer Dependencies

```bash
bun add elysia @elysiajs/html
```

## 🚀 Quick Start

```javascript
import { Elysia } from 'elysia'
import { r2Backup } from '@riligar/elysia-backup'

const app = new Elysia()
    .use(
        r2Backup({
            sourceDir: './data',
            configPath: './config.json',
        })
    )
    .listen(3000)

console.log('🦊 Server running at http://localhost:3000')
console.log('📦 Backup UI at http://localhost:3000/backup')
```

On first run, you'll be guided through an onboarding wizard to configure:

-   Storage credentials (R2/S3)
-   Backup schedule
-   Admin authentication

## ⚙️ Configuration

### Plugin Options

| Option       | Type   | Required | Description                                            |
| ------------ | ------ | -------- | ------------------------------------------------------ |
| `sourceDir`  | string | ✅       | Local directory to backup                              |
| `configPath` | string | ❌       | Path to save runtime config (default: `./config.json`) |

### Runtime Configuration (via UI or config.json)

| Option            | Type     | Description                                    |
| ----------------- | -------- | ---------------------------------------------- |
| `bucket`          | string   | R2/S3 bucket name                              |
| `accessKeyId`     | string   | R2/S3 Access Key ID                            |
| `secretAccessKey` | string   | R2/S3 Secret Access Key                        |
| `endpoint`        | string   | R2/S3 Endpoint URL                             |
| `prefix`          | string   | Prefix for S3 keys (e.g., `backups/`)          |
| `extensions`      | string[] | File extensions to include (empty = all files) |
| `cronSchedule`    | string   | Cron expression for scheduled backups          |
| `cronEnabled`     | boolean  | Enable/disable scheduled backups               |
| `auth.username`   | string   | Admin username                                 |
| `auth.password`   | string   | Admin password                                 |
| `auth.totpSecret` | string   | TOTP secret for 2FA (optional)                 |

## 🔌 API Endpoints

The plugin adds the following routes under `/backup`:

### Pages

| Method | Path                 | Description             |
| ------ | -------------------- | ----------------------- |
| GET    | `/backup`            | Dashboard UI            |
| GET    | `/backup/login`      | Login page              |
| GET    | `/backup/onboarding` | First-time setup wizard |

### Authentication

| Method | Path                  | Description       |
| ------ | --------------------- | ----------------- |
| POST   | `/backup/auth/login`  | Authenticate user |
| POST   | `/backup/auth/logout` | End session       |

### Backup Operations

| Method | Path                  | Description                 |
| ------ | --------------------- | --------------------------- |
| POST   | `/backup/api/run`     | Trigger manual backup       |
| GET    | `/backup/api/files`   | List remote backup files    |
| POST   | `/backup/api/restore` | Restore a specific file     |
| POST   | `/backup/api/delete`  | Delete a remote backup file |
| POST   | `/backup/api/config`  | Update configuration        |

### Two-Factor Authentication (TOTP)

| Method | Path                        | Description                   |
| ------ | --------------------------- | ----------------------------- |
| GET    | `/backup/api/totp/status`   | Check 2FA status              |
| POST   | `/backup/api/totp/generate` | Generate new TOTP secret & QR |
| POST   | `/backup/api/totp/verify`   | Verify and enable 2FA         |
| POST   | `/backup/api/totp/disable`  | Disable 2FA                   |

## 🔐 Security Features

### Session-Based Authentication

-   Secure session tokens with configurable expiration
-   HTTP-only cookies for session management
-   Automatic session cleanup

### Two-Factor Authentication (TOTP)

-   Compatible with any authenticator app (Google Authenticator, Authy, etc.)
-   QR code for easy setup
-   Backup codes support

## 📂 Project Structure

```
src/
├── index.js              # Main plugin entry
├── assets/               # Static assets (favicon, logo)
├── views/
│   ├── LoginPage.js      # Login page
│   ├── DashboardPage.js  # Main dashboard
│   ├── OnboardingPage.js # Setup wizard
│   ├── components/       # UI components
│   │   ├── ActionArea.js
│   │   ├── FilesTab.js
│   │   ├── Footer.js
│   │   ├── Head.js
│   │   ├── Header.js
│   │   ├── LoginCard.js
│   │   ├── OnboardingCard.js
│   │   ├── SecuritySection.js
│   │   ├── SettingsTab.js
│   │   └── StatusCards.js
│   └── scripts/          # Client-side JavaScript
│       ├── backupApp.js
│       ├── loginApp.js
│       └── onboardingApp.js
```

## 🌍 Environment Variables Example

```env
# Optional - for initial configuration
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
```

> **Note:** All configuration can be set via the onboarding wizard. Environment variables are optional.

## 📸 Screenshots

The dashboard provides:

-   **Status Overview** — Cron status, next run time, bucket info
-   **Quick Actions** — Manual backup trigger with real-time feedback
-   **Files Browser** — View, restore, and delete backup files
-   **Settings** — Update storage and backup configuration
-   **Security** — Enable/disable 2FA

## 🤝 Contributing

Contributions are welcome! See our [GitHub repository](https://github.com/riligar-solutions/elysia-backup) for more information.

## 📄 License

MIT © [RiLiGar](https://riligar.click/)

---

<p align="center">
  Made with ❤️ by <a href="https://riligar.click/">RiLiGar</a>
</p>
