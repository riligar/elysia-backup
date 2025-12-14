/**
 * Demo server for elysia-backup plugin
 * Run with: bun run demo/index.js
 */

import { Elysia } from 'elysia'
import { r2Backup } from '../src/index.js'

const app = new Elysia()
    .use(
        r2Backup({
            bucket: process.env.R2_BUCKET || 'demo-bucket',
            accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            endpoint: process.env.R2_ENDPOINT || 'https://example.r2.cloudflarestorage.com',
            sourceDir: process.env.BACKUP_SOURCE_DIR || './demo/data',
            prefix: 'backups/',
            extensions: ['.db', '.sqlite', '.json'],
            cronSchedule: '0 * * * *', // Every hour
            cronEnabled: false, // Disabled by default for demo
        })
    )
    .get('/', () => 'Elysia Backup Demo - Go to /backup for the UI')
    .listen(3000)

console.log(`🦊 Elysia Backup Demo running at http://localhost:${app.server?.port}`)
console.log(`📦 Backup UI available at http://localhost:${app.server?.port}/backup`)
