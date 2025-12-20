import { S3Client } from 'bun'

/**
 * Create an S3/R2 client with the given configuration
 * @param {Object} config - Configuration object
 * @param {string} config.bucket - Bucket name
 * @param {string} config.endpoint - S3/R2 endpoint URL
 * @param {string} config.accessKeyId - Access key ID
 * @param {string} config.secretAccessKey - Secret access key
 * @returns {S3Client} Configured S3 client
 */
export const createS3Client = config => {
    // Debug config (masked for security)
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
