/**
 * Login page component - Modular version
 * Composes login components
 * @param {{ totpEnabled: boolean }} props
 * @returns {string} HTML string
 */
import { Head } from './components/Head.js'
import { LoginCard } from './components/LoginCard.js'
import { loginAppScript } from './scripts/loginApp.js'

export const LoginPage = ({ totpEnabled = false }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    ${Head({ title: 'Login - Backup Manager' })}
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-6 antialiased">
    ${LoginCard({ totpEnabled })}

    ${loginAppScript({ totpEnabled })}
</body>
</html>
`
