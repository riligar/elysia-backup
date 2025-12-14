# @riligar/elysia-backup

Elysia plugin for R2/S3 backup with a built-in UI dashboard. Uses native Bun S3 client for optimal performance.

## Features

-   📁 Backup local directories to R2/S3
-   🔄 Scheduled backups with cron expressions
-   🖥️ Built-in UI dashboard
-   ⬇️ One-click restore
-   🗑️ Delete remote backups
-   ⚙️ Runtime configuration

## Installation

```bash
bun add @riligar/elysia-backup
```

## Usage

```javascript
import { Elysia } from 'elysia'
import { r2Backup } from '@riligar/elysia-backup'

const app = new Elysia()
    .use(
        r2Backup({
            bucket: process.env.R2_BUCKET,
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            endpoint: process.env.R2_ENDPOINT,
            sourceDir: './data',
            prefix: 'backups/',
            extensions: ['.db', '.sqlite'],
            cronSchedule: '0 0 * * *', // Daily at midnight
            cronEnabled: true,
        })
    )
    .listen(3000)

console.log('Server running at http://localhost:3000')
console.log('Backup UI at http://localhost:3000/backup')
```

## Configuration

| Option            | Type     | Required | Description                                                   |
| ----------------- | -------- | -------- | ------------------------------------------------------------- |
| `bucket`          | string   | ✅       | R2/S3 bucket name                                             |
| `accessKeyId`     | string   | ✅       | R2/S3 Access Key ID                                           |
| `secretAccessKey` | string   | ✅       | R2/S3 Secret Access Key                                       |
| `endpoint`        | string   | ✅       | R2/S3 Endpoint URL                                            |
| `sourceDir`       | string   | ✅       | Local directory to backup                                     |
| `prefix`          | string   | ❌       | Prefix for S3 keys (e.g., 'backups/')                         |
| `extensions`      | string[] | ❌       | File extensions to include                                    |
| `cronSchedule`    | string   | ❌       | Cron expression for scheduled backups                         |
| `cronEnabled`     | boolean  | ❌       | Enable/disable scheduled backups                              |
| `configPath`      | string   | ❌       | Path to save runtime config (default: './backup-config.json') |

## API Endpoints

The plugin adds the following routes under `/backup`:

| Method | Path                  | Description           |
| ------ | --------------------- | --------------------- |
| GET    | `/backup`             | UI Dashboard          |
| POST   | `/backup/api/run`     | Trigger manual backup |
| GET    | `/backup/api/files`   | List remote files     |
| POST   | `/backup/api/restore` | Restore a file        |
| POST   | `/backup/api/delete`  | Delete a remote file  |
| POST   | `/backup/api/config`  | Update configuration  |

## Environment Variables Example

```env
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
```

## License

MIT
