/**
 * Demo server for @riligar/elysia-backup plugin
 *
 * Run with: bun run start
 */

import { Elysia } from 'elysia'
import { r2Backup } from '../src/index.js'
import { readFileSync, writeFileSync } from 'fs'

// JSON file paths
const USERS_FILE = './data/users.json'
const PRODUCTS_FILE = './data/products.json'
const ORDERS_FILE = './data/orders.json'

// Helper functions
const read = file => JSON.parse(readFileSync(file, 'utf-8'))
const write = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2))

const app = new Elysia()
    .use(
        r2Backup({
            bucket: process.env.R2_BUCKET || 'demo-bucket',
            accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            endpoint: process.env.R2_ENDPOINT || 'https://example.r2.cloudflarestorage.com',
            sourceDir: './data',
            prefix: 'backups/',
            extensions: ['.json'],
            cronSchedule: '0 * * * *',
            cronEnabled: false,
            // Authentication - provide username and password to enable auth
            auth: {
                username: process.env.BACKUP_USERNAME,
                password: process.env.BACKUP_PASSWORD,
                totpSecret: process.env.BACKUP_TOTP_SECRET, // Optional: base32 secret for 2FA
            },
        })
    )
    .get(
        '/',
        () => `<pre style="font-family:monospace;color:#374151;line-height:1.4;padding:3rem">
🦊 Elysia Backup Demo

<b style="color:#111827">Backup UI</b>
   /backup

<b style="color:#111827">Users</b>
   GET  /api/users
   POST /api/users  { name, email }

<b style="color:#111827">Products</b>
   GET  /api/products
   POST /api/products  { name, price, stock }

<b style="color:#111827">Orders</b>
   GET  /api/orders
   POST /api/orders  { userId, productId, quantity }
</pre>`
    )
    // Users API
    .get('/api/users', () => read(USERS_FILE))
    .post('/api/users', ({ body }) => {
        const data = read(USERS_FILE)
        const user = { id: Date.now(), ...body, createdAt: new Date().toISOString() }
        data.users.push(user)
        write(USERS_FILE, data)
        return user
    })
    // Products API
    .get('/api/products', () => read(PRODUCTS_FILE))
    .post('/api/products', ({ body }) => {
        const data = read(PRODUCTS_FILE)
        const product = { id: Date.now(), ...body }
        data.products.push(product)
        write(PRODUCTS_FILE, data)
        return product
    })
    // Orders API
    .get('/api/orders', () => read(ORDERS_FILE))
    .post('/api/orders', ({ body }) => {
        const data = read(ORDERS_FILE)
        const order = { id: Date.now(), ...body, createdAt: new Date().toISOString(), status: 'pending' }
        data.orders.push(order)
        write(ORDERS_FILE, data)
        return order
    })
    .listen(3000)

console.log(`🦊 Elysia Backup Demo: http://localhost:${app.server?.port}`)
console.log(`📦 Backup UI: http://localhost:${app.server?.port}/backup`)
