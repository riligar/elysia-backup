/**
 * Create authentication middleware
 * @param {Object} options - Middleware options
 * @param {Function} options.getConfig - Function to get current config
 * @param {Object} options.sessionManager - Session manager instance
 * @returns {Function} Elysia middleware function
 */
export const createAuthMiddleware = ({ getConfig, sessionManager }) => {
    return context => {
        const config = getConfig()

        // Only bypass auth if no credentials are configured at all
        if (!config.auth || !config.auth.username || !config.auth.password) {
            return
        }

        const path = context.path

        // Allow access to login page and auth endpoints without authentication
        if (path === '/backup/login' || path === '/backup/auth/login' || path === '/backup/auth/logout') {
            return
        }

        // Check session cookie
        const cookies = context.headers.cookie || ''
        const sessionMatch = cookies.match(/backup-session=([^;]+)/)
        const sessionToken = sessionMatch ? sessionMatch[1] : null

        const session = sessionManager.get(sessionToken)

        if (!session) {
            // Redirect to login page
            context.set.status = 302
            context.set.headers['Location'] = '/backup/login'
            return new Response('Redirecting to login', {
                status: 302,
                headers: { Location: '/backup/login' },
            })
        }
    }
}
