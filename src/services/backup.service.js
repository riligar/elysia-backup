import { readdir, stat, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'
import { createS3Client } from './s3-client.js'

/**
 * Create a backup service instance
 * @param {Function} getConfig - Function to get current configuration
 * @returns {Object} Backup service with all operations
 */
export const createBackupService = getConfig => {
    /**
     * Get a configured S3 client
     */
    const getS3 = () => createS3Client(getConfig())

    /**
     * Upload a single file to S3
     * @param {string} filePath - Local file path
     * @param {string} rootDir - Root directory for relative path calculation
     * @param {string} timestampPrefix - Timestamp to prepend to filename (YYYY-MM-DD_HH-mm-ss)
     */
    const uploadFile = async (filePath, rootDir, timestampPrefix) => {
        const config = getConfig()
        const s3 = getS3()
        const fileContent = await readFile(filePath)

        const relativePath = relative(rootDir, filePath)
        const dir = dirname(relativePath)
        const filename = relativePath.split('/').pop()

        // Parse timestamp to extract date and time parts
        // Expected format: YYYY-MM-DD_HH-mm-ss
        const timestamp = timestampPrefix || new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const datePart = timestamp.slice(0, 10) // YYYY-MM-DD
        const timePart = timestamp.slice(11) || '00-00-00' // HH-mm-ss

        // Format: YYYY-MM-DD/HH-mm-ss_filename.ext
        const newFilename = `${timePart}_${filename}`
        const dateFolder = datePart

        // Reconstruct path: prefix/date/[subdir/]time_filename
        let finalPath
        if (dir === '.') {
            finalPath = join(dateFolder, newFilename)
        } else {
            finalPath = join(dateFolder, dir, newFilename)
        }
        const key = config.prefix ? join(config.prefix, finalPath) : finalPath

        console.log(`Uploading ${key}...`)
        await s3.write(key, fileContent)
    }

    /**
     * Process a directory recursively and upload all matching files
     * @param {string} dir - Directory to process
     * @param {string} timestampPrefix - Timestamp for all files in this batch
     */
    const processDirectory = async (dir, timestampPrefix) => {
        const config = getConfig()
        const files = await readdir(dir)

        for (const file of files) {
            const fullPath = join(dir, file)
            const stats = await stat(fullPath)

            if (stats.isDirectory()) {
                await processDirectory(fullPath, timestampPrefix)
            } else {
                // Filter by extension
                const allowedExtensions = config.extensions || []
                const hasExtension = allowedExtensions.some(ext => file.endsWith(ext))

                // Skip files that look like backups to prevent recursion/duplication
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

    /**
     * List all files in the remote bucket
     * @returns {Array} List of file objects with Key, Size, LastModified
     */
    const listRemoteFiles = async () => {
        const config = getConfig()
        const s3 = getS3()

        try {
            const response = await s3.list({ prefix: config.prefix || '' })

            // Handle array response
            if (Array.isArray(response)) {
                return response.map(f => ({
                    Key: f.key || f.name,
                    Size: f.size,
                    LastModified: f.lastModified,
                }))
            }

            // Handle AWS-like response with contents
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

    /**
     * Restore a file from backup to local filesystem
     * @param {string} key - S3 key of the file to restore
     * @returns {string} Local path where file was restored
     */
    const restoreFile = async key => {
        const config = getConfig()
        const s3 = getS3()
        const file = s3.file(key)

        if (!(await file.exists())) {
            throw new Error(`File ${key} not found in bucket`)
        }

        const arrayBuffer = await file.arrayBuffer()
        const byteArray = new Uint8Array(arrayBuffer)

        // Remove prefix from key to get relative path
        const relativePath = config.prefix ? key.replace(config.prefix, '') : key
        const cleanRelative = relativePath.replace(/^[\/\\]/, '')

        // New structure: YYYY-MM-DD/[subdir/]HH-mm-ss_filename.ext
        // Old structure: YYYY-MM-DD_HH-mm-ss_filename.ext or timestamp_filename.ext
        const pathParts = cleanRelative.split('/')
        const filename = pathParts.pop()

        // Check if first part is a date folder (YYYY-MM-DD)
        const dateFolderRegex = /^\d{4}-\d{2}-\d{2}$/
        let subdir = ''

        if (pathParts.length > 0 && dateFolderRegex.test(pathParts[0])) {
            // New format: remove date folder, keep remaining subdirs
            pathParts.shift() // Remove date folder
            subdir = pathParts.join('/')
        } else {
            // Old format: use dir as-is
            subdir = pathParts.join('/')
        }

        // Strip time prefix from filename (HH-mm-ss_filename or old YYYY-MM-DD_HH-mm-ss_filename)
        const timeOnlyRegex = /^\d{2}-\d{2}-\d{2}_/
        const fullTimestampRegex = /^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)_/
        let originalFilename = filename.replace(timeOnlyRegex, '').replace(fullTimestampRegex, '')

        const finalLocalRelativePath = subdir ? join(subdir, originalFilename) : originalFilename
        const localPath = join(config.sourceDir, finalLocalRelativePath)

        // Ensure directory exists
        await mkdir(dirname(localPath), { recursive: true })
        await writeFile(localPath, byteArray)

        return localPath
    }

    /**
     * Delete a file from the remote bucket
     * @param {string} key - S3 key of the file to delete
     */
    const deleteFile = async key => {
        const s3 = getS3()
        await s3.delete(key)
    }

    return {
        uploadFile,
        processDirectory,
        listRemoteFiles,
        restoreFile,
        deleteFile,
    }
}
