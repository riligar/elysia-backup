/**
 * Dashboard header component with tabs
 * @param {{ hasAuth: boolean }} props
 * @returns {string} HTML string
 */
export const Header = ({ hasAuth }) => `
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div class="flex items-center gap-4">
            <img src="/backup/logo.png" alt="Backup Manager" class="w-12 h-12 rounded-lg">
            <div>
                <h6 class="text-xs font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
                    System Administration
                </h6>
                <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
                    Backup Manager
                </h1>
            </div>
        </div>
        
        <div class="flex items-center gap-4">
            <!-- Tabs -->
            <div class="flex p-1 bg-primary-100/50 rounded-xl">
                <button @click="activeTab = 'dashboard'; $nextTick(() => lucide.createIcons())" 
                    :class="activeTab === 'dashboard' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-primary-600'"
                    class="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2">
                    <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                    Overview
                </button>
                <button @click="activeTab = 'files'; fetchFiles()" 
                    :class="activeTab === 'files' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-primary-600'"
                    class="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2">
                    <i data-lucide="folder-open" class="w-4 h-4"></i>
                    Files & Restore
                </button>
                <button @click="activeTab = 'settings'; $nextTick(() => lucide.createIcons())" 
                    :class="activeTab === 'settings' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-primary-600'"
                    class="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2">
                    <i data-lucide="settings" class="w-4 h-4"></i>
                    Settings
                </button>
            </div>

            ${
                hasAuth
                    ? `
            <!-- Logout Button -->
            <button @click="logout" class="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-all">
                <i data-lucide="log-out" class="w-4 h-4"></i>
                <span>Logout</span>
            </button>
            `
                    : ''
            }
        </div>
    </div>
`
