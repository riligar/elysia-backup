// https://bun.com/docs/runtime/s3
// https://elysiajs.com/plugins/html
import { Elysia, t } from 'elysia'
import { S3Client } from 'bun'
import { CronJob } from 'cron'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { readdir, stat, readFile, writeFile, mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { html } from '@elysiajs/html'

// Import page components
import { LoginPage } from './views/LoginPage.js'
import { DashboardPage } from './views/DashboardPage.js'
import { OnboardingPage } from './views/OnboardingPage.js'

// Session Management
const sessions = new Map()

/**
 * Generate a secure random session token
 */
const generateSessionToken = () => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Create a new session for a user
 */
const createSession = (username, sessionDuration = 24 * 60 * 60 * 1000) => {
    const token = generateSessionToken()
    const expiresAt = Date.now() + sessionDuration
    sessions.set(token, { username, expiresAt })
    return { token, expiresAt }
}

/**
 * Validate and return session data
 */
const getSession = token => {
    if (!token) return null
    const session = sessions.get(token)
    if (!session) return null
    if (Date.now() > session.expiresAt) {
        sessions.delete(token)
        return null
    }
    return session
}

/**
 * Delete a session
 */
const deleteSession = token => {
    if (token) {
        sessions.delete(token)
    }
}

/**
 * Elysia Plugin for R2/S3 Backup with UI (using native Bun.s3)
 *
 * @param {Object} config
 * @param {string} config.bucket - The R2/S3 bucket name
 * @param {string} config.accessKeyId - R2/S3 Access Key ID
 * @param {string} config.secretAccessKey - R2/S3 Secret Access Key
 * @param {string} config.endpoint - R2/S3 Endpoint URL
 * @param {string} config.sourceDir - Local directory to backup
 * @param {string} [config.prefix] - Optional prefix for S3 keys (e.g. 'backups/')
 * @param {string} [config.cronSchedule] - Cron schedule expression
 * @param {boolean} [config.cronEnabled] - Whether the cron schedule is enabled
 * @param {string} [config.configPath] - Path to save runtime configuration (default: './config.json')
 */
export const r2Backup = initialConfig => app => {
    // State to hold runtime configuration (allows UI updates)
    const configPath = initialConfig.configPath || './config.json'

    // Load saved config if exists
    let savedConfig = {}
    if (existsSync(configPath)) {
        try {
            const fileContent = readFileSync(configPath, 'utf-8')
            savedConfig = JSON.parse(fileContent)
            console.log('Loaded config from', configPath)
        } catch (e) {
            console.error('Failed to load backup config:', e)
        }
    }

    let config = { ...initialConfig, ...savedConfig }
    let backupJob = null

    // Helper to check if config.json exists and has required fields
    const hasValidConfig = () => {
        if (!existsSync(configPath)) return false
        try {
            const content = readFileSync(configPath, 'utf-8')
            const parsed = JSON.parse(content)
            // Check minimum required fields for system to work
            return !!(parsed.bucket && parsed.endpoint && parsed.accessKeyId && parsed.secretAccessKey && parsed.auth?.username && parsed.auth?.password)
        } catch {
            return false
        }
    }

    const getS3Client = () => {
        console.log('S3 Config:', {
            bucket: config.bucket,
            endpoint: config.endpoint,
            accessKeyId: config.accessKeyId ? '***' + config.accessKeyId.slice(-4) : 'missing',
            hasSecret: !!config.secretAccessKey,
        })

        return new S3Client({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            endpoint: config.endpoint,
            bucket: config.bucket,
            region: 'auto',
        })
    }

    const uploadFile = async (filePath, rootDir, timestampPrefix) => {
        const s3 = getS3Client()
        const fileContent = await readFile(filePath)

        const relativePath = relative(rootDir, filePath)
        const dir = dirname(relativePath)
        const filename = relativePath.split('/').pop()

        const timestamp = timestampPrefix || new Date().toISOString()
        const newFilename = `${timestamp}_${filename}`

        const finalPath = dir === '.' ? newFilename : join(dir, newFilename)
        const key = config.prefix ? join(config.prefix, finalPath) : finalPath

        console.log(`Uploading ${key}...`)
        await s3.write(key, fileContent)
    }

    const processDirectory = async (dir, timestampPrefix) => {
        const files = await readdir(dir)
        for (const file of files) {
            const fullPath = join(dir, file)
            const stats = await stat(fullPath)
            if (stats.isDirectory()) {
                await processDirectory(fullPath, timestampPrefix)
            } else {
                const allowedExtensions = config.extensions || []
                const hasExtension = allowedExtensions.some(ext => file.endsWith(ext))

                const timestampRegex = /^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)_/
                if (timestampRegex.test(file)) {
                    console.log(`Skipping backup-like file: ${file}`)
                    continue
                }

                if (allowedExtensions.length === 0 || hasExtension) {
                    await uploadFile(fullPath, config.sourceDir, timestampPrefix)
                }
            }
        }
    }

    const setupCron = () => {
        if (backupJob) {
            backupJob.stop()
            backupJob = null
        }

        if (config.cronSchedule && config.cronEnabled !== false) {
            console.log(`Setting up backup cron: ${config.cronSchedule}`)
            try {
                backupJob = new CronJob(
                    config.cronSchedule,
                    async () => {
                        console.log('Running scheduled backup...')
                        try {
                            const now = new Date()
                            const timestamp =
                                now.getFullYear() +
                                '-' +
                                String(now.getMonth() + 1).padStart(2, '0') +
                                '-' +
                                String(now.getDate()).padStart(2, '0') +
                                '_' +
                                String(now.getHours()).padStart(2, '0') +
                                '-' +
                                String(now.getMinutes()).padStart(2, '0') +
                                '-' +
                                String(now.getSeconds()).padStart(2, '0')

                            await processDirectory(config.sourceDir, timestamp)
                            console.log('Scheduled backup completed')
                        } catch (e) {
                            console.error('Scheduled backup failed:', e)
                        }
                    },
                    null,
                    true
                )
            } catch (e) {
                console.error('Invalid cron schedule:', e.message)
            }
        }
    }

    setupCron()

    const listRemoteFiles = async () => {
        const s3 = getS3Client()
        try {
            const response = await s3.list({ prefix: config.prefix || '' })
            if (Array.isArray(response)) {
                return response.map(f => ({
                    Key: f.key || f.name,
                    Size: f.size,
                    LastModified: f.lastModified,
                }))
            }
            if (response.contents) {
                return response.contents.map(f => ({
                    Key: f.key,
                    Size: f.size,
                    LastModified: f.lastModified,
                }))
            }
            console.log('Unknown list response structure:', response)
            return []
        } catch (e) {
            console.error('Error listing files with Bun.s3:', e)
            return []
        }
    }

    const restoreFile = async key => {
        const s3 = getS3Client()
        const file = s3.file(key)

        if (!(await file.exists())) {
            throw new Error(`File ${key} not found in bucket`)
        }

        const arrayBuffer = await file.arrayBuffer()
        const byteArray = new Uint8Array(arrayBuffer)

        const relativePath = config.prefix ? key.replace(config.prefix, '') : key
        const cleanRelative = relativePath.replace(/^[\/\\]/, '')

        const dir = dirname(cleanRelative)
        const filename = cleanRelative.split('/').pop()

        const timestampRegex = /^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)_/
        const originalFilename = filename.replace(timestampRegex, '')

        const finalLocalRelativePath = dir === '.' ? originalFilename : join(dir, originalFilename)
        const localPath = join(config.sourceDir, finalLocalRelativePath)

        await mkdir(dirname(localPath), { recursive: true })
        await writeFile(localPath, byteArray)
        return localPath
    }

    const deleteFile = async key => {
        const s3 = getS3Client()
        await s3.delete(key)
    }

    const getJobStatus = () => {
        const isRunning = !!backupJob && config.cronEnabled !== false
        let nextRun = null
        if (isRunning && backupJob) {
            try {
                const nextDate = backupJob.nextDate()
                if (nextDate) {
                    nextRun = nextDate.toJSDate().toISOString()
                }
            } catch (e) {
                console.error('Error getting next date', e)
            }
        }
        return { isRunning, nextRun }
    }

    return app.use(html()).group('/backup', app => {
        // Authentication Middleware
        const authMiddleware = context => {
            // Skip auth entirely if no valid config (needs onboarding)
            if (!hasValidConfig()) {
                return
            }

            if (!config.auth || !config.auth.username || !config.auth.password) {
                return
            }

            const path = context.path

            // Skip auth for login, logout, onboarding, and static assets
            if (
                path === '/backup/login' ||
                path === '/backup/auth/login' ||
                path === '/backup/auth/logout' ||
                path === '/backup/onboarding' ||
                path === '/backup/api/onboarding' ||
                path === '/backup/favicon.ico' ||
                path === '/backup/logo.png'
            ) {
                return
            }

            const cookies = context.headers.cookie || ''
            const sessionMatch = cookies.match(/backup-session=([^;]+)/)
            const sessionToken = sessionMatch ? sessionMatch[1] : null

            const session = getSession(sessionToken)

            if (!session) {
                context.set.status = 302
                context.set.headers['Location'] = '/backup/login'
                return new Response('Redirecting to login', {
                    status: 302,
                    headers: { Location: '/backup/login' },
                })
            }
        }

        return (
            app
                .onBeforeHandle(authMiddleware)

                // AUTH: Login Page
                .get('/login', ({ set }) => {
                    if (!config.auth || !config.auth.username || !config.auth.password) {
                        set.status = 302
                        set.headers['Location'] = '/backup'
                        return
                    }

                    return LoginPage({ totpEnabled: !!config.auth?.totpSecret })
                })

                // AUTH: Login Endpoint
                .post(
                    '/auth/login',
                    async ({ body, set }) => {
                        if (!config.auth || !config.auth.username || !config.auth.password) {
                            set.status = 403
                            return {
                                status: 'error',
                                message: 'Authentication is not configured',
                            }
                        }

                        const { username, password, totpCode } = body

                        if (username === config.auth.username && password === config.auth.password) {
                            if (config.auth.totpSecret) {
                                if (!totpCode) {
                                    set.status = 401
                                    return { status: 'error', message: 'Authenticator code is required' }
                                }

                                const isValidTotp = authenticator.check(totpCode, config.auth.totpSecret)
                                if (!isValidTotp) {
                                    set.status = 401
                                    return { status: 'error', message: 'Invalid authenticator code' }
                                }
                            }

                            const sessionDuration = config.auth.sessionDuration || 24 * 60 * 60 * 1000
                            const { token, expiresAt } = createSession(username, sessionDuration)

                            const expiresDate = new Date(expiresAt)
                            set.headers['Set-Cookie'] = `backup-session=${token}; Path=/backup; HttpOnly; SameSite=Lax; Expires=${expiresDate.toUTCString()}`

                            return { status: 'success', message: 'Login successful' }
                        } else {
                            set.status = 401
                            return { status: 'error', message: 'Invalid username or password' }
                        }
                    },
                    {
                        body: t.Object({
                            username: t.String(),
                            password: t.String(),
                            totpCode: t.Optional(t.String()),
                        }),
                    }
                )

                // AUTH: Logout Endpoint
                .post('/auth/logout', ({ headers, set }) => {
                    const cookies = headers.cookie || ''
                    const sessionMatch = cookies.match(/backup-session=([^;]+)/)
                    const sessionToken = sessionMatch ? sessionMatch[1] : null

                    if (sessionToken) {
                        deleteSession(sessionToken)
                    }

                    set.headers['Set-Cookie'] = `backup-session=; Path=/backup; HttpOnly; SameSite=Lax; Max-Age=0`

                    return { status: 'success', message: 'Logged out successfully' }
                })

                // TOTP: Get Status
                .get('/api/totp/status', () => {
                    return {
                        enabled: !!config.auth?.totpSecret,
                    }
                })

                // TOTP: Generate new secret and QR code
                .post('/api/totp/generate', async () => {
                    const secret = authenticator.generateSecret()
                    const serviceName = config.serviceName || 'Backup Manager'
                    const accountName = config.auth?.username || 'admin'

                    const otpauth = authenticator.keyuri(accountName, serviceName, secret)
                    const qrCodeDataUrl = await QRCode.toDataURL(otpauth)

                    return {
                        status: 'success',
                        secret,
                        qrCode: qrCodeDataUrl,
                        otpauth,
                    }
                })

                // TOTP: Verify and save
                .post(
                    '/api/totp/verify',
                    async ({ body, set }) => {
                        const { secret, code } = body

                        const isValid = authenticator.check(code, secret)

                        if (!isValid) {
                            set.status = 400
                            return { status: 'error', message: 'Invalid code. Please try again.' }
                        }

                        config.auth = config.auth || {}
                        config.auth.totpSecret = secret

                        try {
                            await writeFile(configPath, JSON.stringify(config, null, 2))
                        } catch (e) {
                            console.error('Failed to save TOTP config:', e)
                            set.status = 500
                            return { status: 'error', message: 'Failed to save configuration' }
                        }

                        return { status: 'success', message: 'Two-factor authentication enabled successfully' }
                    },
                    {
                        body: t.Object({
                            secret: t.String(),
                            code: t.String(),
                        }),
                    }
                )

                // TOTP: Disable
                .post(
                    '/api/totp/disable',
                    async ({ body, set }) => {
                        const { code } = body

                        if (config.auth?.totpSecret) {
                            const isValid = authenticator.check(code, config.auth.totpSecret)
                            if (!isValid) {
                                set.status = 400
                                return { status: 'error', message: 'Invalid code. Please enter your current authenticator code.' }
                            }
                        }

                        if (config.auth) {
                            delete config.auth.totpSecret
                        }

                        try {
                            await writeFile(configPath, JSON.stringify(config, null, 2))
                        } catch (e) {
                            console.error('Failed to save config:', e)
                            set.status = 500
                            return { status: 'error', message: 'Failed to save configuration' }
                        }

                        return { status: 'success', message: 'Two-factor authentication disabled' }
                    },
                    {
                        body: t.Object({
                            code: t.String(),
                        }),
                    }
                )

                // API: Run Backup
                .post(
                    '/api/run',
                    async ({ body, set }) => {
                        try {
                            const { timestamp } = body || {}
                            console.log(`Starting backup of ${config.sourceDir} to ${config.bucket} with timestamp ${timestamp}`)
                            await processDirectory(config.sourceDir, timestamp)
                            return {
                                status: 'success',
                                message: 'Backup completed successfully',
                                timestamp: new Date().toISOString(),
                            }
                        } catch (error) {
                            console.error('Backup failed:', error)
                            set.status = 500
                            return { status: 'error', message: error.message }
                        }
                    },
                    {
                        body: t.Optional(
                            t.Object({
                                timestamp: t.Optional(t.String()),
                            })
                        ),
                    }
                )

                // API: List Files
                .get('/api/files', async ({ set }) => {
                    try {
                        const files = await listRemoteFiles()
                        return {
                            files: files.map(f => ({
                                key: f.Key,
                                size: f.Size,
                                lastModified: f.LastModified,
                            })),
                        }
                    } catch (error) {
                        set.status = 500
                        return { status: 'error', message: error.message }
                    }
                })

                // API: Restore File
                .post(
                    '/api/restore',
                    async ({ body, set }) => {
                        try {
                            const { key } = body
                            if (!key) throw new Error('Key is required')
                            const localPath = await restoreFile(key)
                            return { status: 'success', message: `Restored to ${localPath}` }
                        } catch (error) {
                            set.status = 500
                            return { status: 'error', message: error.message }
                        }
                    },
                    {
                        body: t.Object({
                            key: t.String(),
                        }),
                    }
                )

                // API: Delete File
                .post(
                    '/api/delete',
                    async ({ body, set }) => {
                        try {
                            const { key } = body
                            if (!key) throw new Error('Key is required')
                            await deleteFile(key)
                            return { status: 'success', message: `Deleted ${key}` }
                        } catch (error) {
                            set.status = 500
                            return { status: 'error', message: error.message }
                        }
                    },
                    {
                        body: t.Object({
                            key: t.String(),
                        }),
                    }
                )

                // API: Update Config
                .post(
                    '/api/config',
                    async ({ body }) => {
                        let newConfig = { ...body }
                        if (typeof newConfig.extensions === 'string') {
                            newConfig.extensions = newConfig.extensions
                                .split(',')
                                .map(e => e.trim())
                                .filter(Boolean)
                        }
                        config = { ...config, ...newConfig }

                        try {
                            await writeFile(configPath, JSON.stringify(config, null, 2))
                        } catch (e) {
                            console.error('Failed to save config:', e)
                        }

                        setupCron()
                        return {
                            status: 'success',
                            config: { ...config, secretAccessKey: '***' },
                            jobStatus: getJobStatus(),
                        }
                    },
                    {
                        body: t.Object({
                            bucket: t.String(),
                            endpoint: t.String(),
                            sourceDir: t.String(),
                            prefix: t.Optional(t.String()),
                            extensions: t.Optional(t.Union([t.Array(t.String()), t.String()])),
                            accessKeyId: t.String(),
                            secretAccessKey: t.String(),
                            cronSchedule: t.Optional(t.String()),
                            cronEnabled: t.Optional(t.Boolean()),
                        }),
                    }
                )

                // Static Assets: Favicon
                .get('/favicon.ico', () => {
                    const faviconPath = new URL('./assets/favicon.ico', import.meta.url).pathname
                    const content = readFileSync(faviconPath)
                    return new Response(content, {
                        headers: { 'Content-Type': 'image/x-icon', 'Cache-Control': 'public, max-age=86400' },
                    })
                })

                // Static Assets: Logo
                .get('/logo.png', () => {
                    const logoPath = new URL('./assets/logo.png', import.meta.url).pathname
                    const content = readFileSync(logoPath)
                    return new Response(content, {
                        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
                    })
                })

                // ONBOARDING: Setup Page
                .get('/onboarding', ({ set }) => {
                    // If already configured, redirect to dashboard
                    if (hasValidConfig()) {
                        set.status = 302
                        set.headers['Location'] = '/backup'
                        return
                    }
                    return OnboardingPage({ sourceDir: config.sourceDir })
                })

                // ONBOARDING: Save Initial Config
                .post(
                    '/api/onboarding',
                    async ({ body, set }) => {
                        // Don't allow if already configured
                        if (hasValidConfig()) {
                            set.status = 403
                            return { status: 'error', message: 'System is already configured' }
                        }

                        const { endpoint, bucket, prefix, accessKeyId, secretAccessKey, extensions, cronSchedule, cronEnabled, username, password } = body

                        // Parse extensions
                        let parsedExtensions = []
                        if (extensions) {
                            parsedExtensions = extensions
                                .split(',')
                                .map(e => e.trim())
                                .filter(Boolean)
                        }

                        // Build initial config
                        const initialConfigData = {
                            endpoint,
                            bucket,
                            prefix: prefix || '',
                            accessKeyId,
                            secretAccessKey,
                            extensions: parsedExtensions,
                            cronSchedule: cronSchedule || '0 0 * * *',
                            cronEnabled: cronEnabled !== false,
                            auth: {
                                username,
                                password,
                            },
                        }

                        try {
                            await writeFile(configPath, JSON.stringify(initialConfigData, null, 2))

                            // Update runtime config
                            config = { ...config, ...initialConfigData }

                            // Setup cron if enabled
                            setupCron()

                            return { status: 'success', message: 'Configuration saved successfully' }
                        } catch (e) {
                            console.error('Failed to save onboarding config:', e)
                            set.status = 500
                            return { status: 'error', message: 'Failed to save configuration' }
                        }
                    },
                    {
                        body: t.Object({
                            endpoint: t.String(),
                            bucket: t.String(),
                            prefix: t.Optional(t.String()),
                            accessKeyId: t.String(),
                            secretAccessKey: t.String(),
                            extensions: t.Optional(t.String()),
                            cronSchedule: t.Optional(t.String()),
                            cronEnabled: t.Optional(t.Boolean()),
                            username: t.String(),
                            password: t.String(),
                        }),
                    }
                )

                // UI: Dashboard
                .get('/', ({ set }) => {
                    // Redirect to onboarding if no valid config
                    if (!hasValidConfig()) {
                        set.status = 302
                        set.headers['Location'] = '/backup/onboarding'
                        return
                    }

                    const jobStatus = getJobStatus()
                    const hasAuth = !!(config.auth && config.auth.username && config.auth.password)
                    return DashboardPage({ config, jobStatus, hasAuth })
                })
        )
    })
}
