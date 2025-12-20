/**
 * Onboarding page component
 * First-run setup wizard for configuring the backup system
 * @returns {string} HTML string
 */
import { Head } from './components/Head.js'
import { OnboardingCard } from './components/OnboardingCard.js'
import { onboardingAppScript } from './scripts/onboardingApp.js'

export const OnboardingPage = ({ sourceDir }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    ${Head({ title: 'Setup - Backup Manager' })}
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-6 antialiased">
    ${OnboardingCard({ sourceDir })}

    ${onboardingAppScript({ sourceDir })}
</body>
</html>
`
