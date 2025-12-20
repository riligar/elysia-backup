/**
 * Session Management Module
 * Handles secure session creation, validation, and cleanup
 */

/**
 * Generate a secure random session token
 * @returns {string} 64-character hex token
 */
export const generateSessionToken = () => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Create a session manager instance
 * @returns {Object} Session manager with create/get/delete methods
 */
export const createSessionManager = () => {
    const sessions = new Map()

    return {
        /**
         * Create a new session for a user
         * @param {string} username - Username for the session
         * @param {number} sessionDuration - Duration in milliseconds (default: 24h)
         * @returns {Object} Session token and expiration
         */
        create: (username, sessionDuration = 24 * 60 * 60 * 1000) => {
            const token = generateSessionToken()
            const expiresAt = Date.now() + sessionDuration
            sessions.set(token, { username, expiresAt })
            return { token, expiresAt }
        },

        /**
         * Get and validate a session by token
         * @param {string} token - Session token
         * @returns {Object|null} Session data or null if invalid/expired
         */
        get: token => {
            if (!token) return null

            const session = sessions.get(token)
            if (!session) return null

            if (Date.now() > session.expiresAt) {
                sessions.delete(token)
                return null
            }

            return session
        },

        /**
         * Delete a session
         * @param {string} token - Session token to delete
         */
        delete: token => {
            if (token) {
                sessions.delete(token)
            }
        },

        /**
         * Get the number of active sessions
         * @returns {number} Count of active sessions
         */
        count: () => sessions.size,

        /**
         * Clean up expired sessions
         * @returns {number} Number of sessions cleaned
         */
        cleanup: () => {
            const now = Date.now()
            let cleaned = 0

            for (const [token, session] of sessions) {
                if (now > session.expiresAt) {
                    sessions.delete(token)
                    cleaned++
                }
            }

            return cleaned
        },
    }
}
