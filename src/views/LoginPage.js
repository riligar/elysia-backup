/**
 * Login page component - Modular version
 * Composes login components
 * @param {{ totpEnabled: boolean }} props
 * @returns {string} HTML string
 */
import { Head } from './components/Head.js'
import { LoginCard } from './components/LoginCard.js'
import { Footer } from './components/Footer.js'
import { loginAppScript } from './scripts/loginApp.js'

export const LoginPage = ({ totpEnabled = false }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    ${Head({ title: 'Login - Backup Manager' })}
</head>
<body class="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-6 antialiased">
    <div class="flex-1 flex items-center justify-center w-full">
        ${LoginCard({ totpEnabled })}
    </div>
    
    <div class="w-full max-w-md">
        ${Footer()}
    </div>

    ${loginAppScript({ totpEnabled })}
</body>
</html>
`
