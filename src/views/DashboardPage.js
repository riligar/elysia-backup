/**
 * Dashboard page component - Modular version
 * Composes all dashboard components
 * @param {{ config: object, jobStatus: object, hasAuth: boolean }} props
 * @returns {string} HTML string
 */
import { Head } from './components/Head.js'
import { Header } from './components/Header.js'
import { StatusCards } from './components/StatusCards.js'
import { ActionArea } from './components/ActionArea.js'
import { FilesTab } from './components/FilesTab.js'
import { SettingsTab } from './components/SettingsTab.js'
import { SecuritySection } from './components/SecuritySection.js'
import { backupAppScript } from './scripts/backupApp.js'

export const DashboardPage = ({ config, jobStatus, hasAuth }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    ${Head({ title: 'R2 Backup Manager' })}
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen p-12 antialiased selection:bg-gray-900 selection:text-white">
    <div class="max-w-5xl mx-auto" x-data="backupApp()">
        <!-- Header -->
        ${Header({ hasAuth })}

        <!-- Dashboard Tab -->
        <div x-show="activeTab === 'dashboard'" class="space-y-12" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0 translate-y-2"
             x-transition:enter-end="opacity-100 translate-y-0">
            
            <!-- Status Cards -->
            ${StatusCards()}

            <!-- Action Area -->
            ${ActionArea()}
        </div>

        <!-- Files Tab -->
        ${FilesTab()}

        <!-- Settings Tab -->
        <div x-show="activeTab === 'settings'" class="max-w-3xl mx-auto" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0 translate-y-2"
             x-transition:enter-end="opacity-100 translate-y-0">
            ${SettingsTab()}
            ${SecuritySection()}
        </div>
    </div>

    ${backupAppScript({ config, jobStatus })}
</body>
</html>
`
