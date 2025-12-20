/**
 * Dashboard page component
 * Uses template string approach for Alpine.js compatibility
 * @param {{ config: object, jobStatus: object, hasAuth: boolean }} props
 * @returns {string} HTML string
 */
export const DashboardPage = ({ config, jobStatus, hasAuth }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>R2 Backup Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Montserrat', 'sans-serif'],
                    },
                    colors: {
                        gray: {
                            50: '#F9FAFB',
                            100: '#F3F4F6',
                            200: '#E5E7EB',
                            300: '#D1D5DB',
                            400: '#9CA3AF',
                            500: '#6B7280',
                            600: '#4B5563',
                            700: '#374151',
                            800: '#1F2937',
                            900: '#111827',
                        }
                    }
                }
            }
        }
    </script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        [x-cloak] { display: none !important; }
    </style>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen p-12 antialiased selection:bg-gray-900 selection:text-white">
    <div class="max-w-5xl mx-auto" x-data="backupApp()">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
                <h6 class="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <i data-lucide="shield-check" class="w-4 h-4"></i>
                    System Administration
                </h6>
                <h1 class="text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                    Backup Manager
                </h1>
            </div>
            
            <div class="flex items-center gap-4">
                <!-- Tabs -->
                <div class="flex p-1 bg-gray-200/50 rounded-xl">
                    <button @click="activeTab = 'dashboard'; $nextTick(() => lucide.createIcons())" 
                        :class="activeTab === 'dashboard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                        class="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2">
                        <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                        Overview
                    </button>
                    <button @click="activeTab = 'files'; fetchFiles()" 
                        :class="activeTab === 'files' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                        class="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2">
                        <i data-lucide="folder-open" class="w-4 h-4"></i>
                        Files & Restore
                    </button>
                    <button @click="activeTab = 'settings'; $nextTick(() => lucide.createIcons())" 
                        :class="activeTab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
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

        <!-- Dashboard Tab -->
        <div x-show="activeTab === 'dashboard'" class="space-y-12" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0 translate-y-2"
             x-transition:enter-end="opacity-100 translate-y-0">
            
            <!-- Status Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <div class="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2">
                        <i data-lucide="folder" class="w-4 h-4"></i>
                        Local Source
                    </div>
                    <div class="text-gray-900 font-semibold truncate" x-text="config.sourceDir"></div>
                </div>
                <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <div class="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2">
                        <i data-lucide="cloud" class="w-4 h-4"></i>
                        Target Bucket
                    </div>
                    <div class="text-gray-900 font-semibold truncate" x-text="config.bucket"></div>
                </div>
                <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <div class="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2">
                        <i data-lucide="clock" class="w-4 h-4"></i>
                        Last Backup
                    </div>
                    <div class="text-gray-900 font-semibold" x-text="lastBackup || 'No backup recorded'"></div>
                </div>
                <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden group">
                    <div class="text-gray-500 text-sm font-medium mb-3 flex items-center gap-2">
                        <i data-lucide="calendar-clock" class="w-4 h-4"></i>
                        Schedule Status
                    </div>
                    
                    <template x-if="cronStatus.isRunning">
                        <div class="flex items-center gap-3">
                            <span class="relative flex h-2.5 w-2.5 shrink-0" title="Active">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            <div class="flex items-baseline gap-1.5 min-w-0">
                                <span class="text-gray-900 font-bold text-xs font-mono truncate" x-text="new Date(cronStatus.nextRun).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })"></span>
                            </div>
                        </div>
                    </template>

                    <template x-if="!cronStatus.isRunning">
                        <div class="flex items-center gap-3">
                            <span class="h-2.5 w-2.5 rounded-full bg-gray-300 shrink-0" title="Stopped"></span>
                            <span class="text-gray-400 text-sm italic">Scheduler paused</span>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Action Area -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                <div class="p-10 flex flex-col items-center justify-center text-center">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-400">
                        <i data-lucide="save" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Trigger Manual Backup</h3>
                    <p class="text-gray-500 max-w-md mb-8 leading-relaxed">Initiate a backup of your local directory to the configured R2 bucket. This will upload all files recursively.</p>
                    
                    <button 
                        @click="runBackup()" 
                        :disabled="loading"
                        class="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 bg-gray-900 rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-70 disabled:cursor-not-allowed">
                        <span x-show="!loading" class="flex items-center gap-2">
                            <i data-lucide="play-circle" class="w-5 h-5"></i>
                            Start Backup Process
                        </span>
                        <span x-show="loading" class="flex items-center gap-2">
                            <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
                            Processing...
                        </span>
                    </button>
                </div>
                
                <!-- Logs -->
                <div class="bg-gray-50 border-t border-gray-100 p-8">
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Activity Log</h4>
                    <div class="space-y-3">
                        <template x-for="log in logs" :key="log.id">
                            <div class="flex items-start gap-4 text-sm">
                                <span class="font-mono text-xs text-gray-400 mt-0.5" x-text="log.time"></span>
                                <div class="flex items-center gap-2">
                                    <i :data-lucide="log.type === 'error' ? 'alert-circle' : 'info'" 
                                       :class="log.type === 'error' ? 'text-red-600' : 'text-gray-400'"
                                       class="w-4 h-4"></i>
                                    <span :class="log.type === 'error' ? 'text-red-600 font-medium' : 'text-gray-600'" x-text="log.message"></span>
                                </div>
                            </div>
                        </template>
                        <div x-show="logs.length === 0" class="text-gray-400 text-sm italic">No recent activity recorded.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Files Tab -->
        <div x-show="activeTab === 'files'" class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0 translate-y-2"
             x-transition:enter-end="opacity-100 translate-y-0">
            <div class="p-8 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <i data-lucide="server" class="w-5 h-5 text-gray-400"></i>
                        Remote Files
                    </h2>
                    <p class="text-gray-500 text-sm mt-1">Files currently stored in your R2 bucket</p>
                </div>
                <button @click="fetchFiles()" class="text-gray-900 hover:text-gray-600 font-semibold text-sm transition-colors flex items-center gap-2">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    Refresh List
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="border-b border-gray-100">
                            <th class="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">File Key</th>
                            <th class="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Size</th>
                            <th class="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Modified</th>
                            <th class="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <template x-for="group in groups" :key="group.name">
                        <tbody class="divide-y divide-gray-50 border-b border-gray-100">
                            <!-- Folder Header -->
                            <tr class="bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors select-none" 
                                @click="group.expanded = !group.expanded; $nextTick(() => lucide.createIcons())">
                                <td colspan="4" class="px-8 py-3">
                                    <div class="flex items-center gap-3">
                                        <i :data-lucide="group.expanded ? 'folder-open' : 'folder'" class="w-5 h-5 text-gray-400"></i>
                                        <span class="font-bold text-gray-700 text-sm" x-text="formatDateHeader(group.name)"></span>
                                        <span class="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full" x-text="group.files.length"></span>
                                    </div>
                                </td>
                            </tr>

                            <!-- Files in Group -->
                            <template x-for="file in group.files" :key="file.key">
                                <tr x-show="group.expanded" class="hover:bg-gray-50 transition-colors duration-150 group bg-white">
                                    <td class="px-8 py-5 font-medium text-gray-900 text-sm pl-12" x-text="file.key"></td>
                                    <td class="px-8 py-5 text-gray-500 text-sm" x-text="formatBytes(file.size)"></td>
                                    <td class="px-8 py-5 text-gray-500 text-sm" x-text="new Date(file.lastModified).toLocaleString()"></td>
                                    <td class="px-8 py-5 text-right">
                                        <div class="flex justify-end gap-3 items-center">
                                            <!-- Restore Button -->
                                            <button 
                                                x-data="holdButton(() => restoreFile(file.key))"
                                                @mousedown="start()" @touchstart.prevent="start()"
                                                @mouseup="stop()" @mouseleave="stop()" @touchend="stop()"
                                                class="relative overflow-hidden px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors select-none"
                                                title="Hold 3s to Restore"
                                            >
                                                <div class="absolute inset-0 bg-blue-200/50 origin-left transition-all duration-0 ease-linear" :style="'width: ' + progress + '%'"></div>
                                                <span class="relative z-10 flex items-center gap-2">
                                                    <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                                                    <span x-text="progress > 0 ? 'Hold...' : 'Restore'"></span>
                                                </span>
                                            </button>

                                            <!-- Delete Button -->
                                            <button 
                                                x-data="holdButton(() => deleteFile(file.key))"
                                                @mousedown="start()" @touchstart.prevent="start()"
                                                @mouseup="stop()" @mouseleave="stop()" @touchend="stop()"
                                                class="relative overflow-hidden px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 transition-colors select-none"
                                                title="Hold 3s to Delete"
                                            >
                                                <div class="absolute inset-0 bg-red-200/50 origin-left transition-all duration-0 ease-linear" :style="'width: ' + progress + '%'"></div>
                                                <span class="relative z-10 flex items-center gap-2">
                                                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                                                    <span x-text="progress > 0 ? 'Hold...' : 'Delete'"></span>
                                                </span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </template>
                    
                    <!-- Empty State -->
                    <tbody x-show="groups.length === 0">
                        <tr>
                            <td colspan="4" class="px-8 py-16 text-center">
                                <div class="flex flex-col items-center justify-center">
                                    <span x-show="!loadingFiles" class="text-gray-500 font-medium flex flex-col items-center gap-2">
                                        <i data-lucide="inbox" class="w-8 h-8 text-gray-300"></i>
                                        No files found in bucket
                                    </span>
                                    <span x-show="loadingFiles" class="text-gray-500 font-medium animate-pulse flex flex-col items-center gap-2">
                                        <i data-lucide="loader" class="w-8 h-8 animate-spin text-gray-300"></i>
                                        Loading remote files...
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Settings Tab -->
        <div x-show="activeTab === 'settings'" class="max-w-3xl mx-auto" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0 translate-y-2"
             x-transition:enter-end="opacity-100 translate-y-0">
            <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10">
                <h2 class="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                    <i data-lucide="sliders" class="w-5 h-5"></i>
                    Configuration
                </h2>
                <form @submit.prevent="saveConfig" class="space-y-8">
                    <div class="space-y-6">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Endpoint URL</label>
                            <input type="text" x-model="configForm.endpoint" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                        </div>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Bucket Name</label>
                                <input type="text" x-model="configForm.bucket" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Prefix (Folder)</label>
                                <input type="text" x-model="configForm.prefix" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Source Directory (Local)</label>
                            <input type="text" x-model="configForm.sourceDir" readonly class="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed focus:outline-none font-medium">
                            <p class="text-xs text-gray-400 mt-1">Defined in server configuration</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Allowed Extensions (comma separated)</label>
                            <input type="text" x-model="configForm.extensions" placeholder=".db, .sqlite" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Cron Schedule</label>
                            <div class="flex gap-4 items-center">
                                <div class="relative flex-grow">
                                    <input type="text" x-model="configForm.cronSchedule" placeholder="0 0 * * *" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                        <a href="https://crontab.guru/" target="_blank" class="underline hover:text-gray-800">Help</a>
                                    </div>
                                </div>
                                <div class="flex gap-2 shrink-0">
                                    <button 
                                        type="button"
                                        @click="configForm.cronEnabled = true; saveConfig()"
                                        :class="configForm.cronEnabled !== false ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'"
                                        class="px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                                    >
                                        <i data-lucide="play" class="w-4 h-4"></i>
                                        Start
                                    </button>
                                    <button 
                                        type="button"
                                        @click="configForm.cronEnabled = false; saveConfig()"
                                        :class="configForm.cronEnabled === false ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'"
                                        class="px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                                    >
                                        <i data-lucide="square" class="w-4 h-4"></i>
                                        Stop
                                    </button>
                                </div>
                            </div>
                            <p class="text-xs text-gray-400 mt-1">Format: Minute Hour Day Month DayOfWeek (e.g., "0 0 * * *" for daily at midnight)</p>
                        </div>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Access Key ID</label>
                                <input type="text" x-model="configForm.accessKeyId" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Secret Access Key</label>
                                <input type="password" x-model="configForm.secretAccessKey" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                            </div>
                        </div>
                    </div>
                    
                    <div class="pt-4 flex justify-end">
                        <button type="submit" class="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2">
                            <i data-lucide="save" class="w-4 h-4"></i>
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>

            <!-- Security Section -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10 mt-8">
                <h2 class="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                    <i data-lucide="shield" class="w-5 h-5"></i>
                    Security
                </h2>
                
                <!-- TOTP Setup -->
                <div class="space-y-6">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                                <i data-lucide="smartphone" class="w-4 h-4"></i>
                                Two-Factor Authentication (2FA)
                            </h3>
                            <p class="text-sm text-gray-500 mt-1">
                                Add an extra layer of security using an authenticator app
                            </p>
                        </div>
                        <div x-show="!totpEnabled && !showTotpSetup">
                            <button 
                                @click="generateTotp()"
                                class="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 px-5 rounded-lg transition-all flex items-center gap-2"
                            >
                                <i data-lucide="plus" class="w-4 h-4"></i>
                                Enable 2FA
                            </button>
                        </div>
                        <div x-show="totpEnabled && !showTotpSetup">
                            <span class="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-sm">
                                <i data-lucide="check-circle" class="w-4 h-4"></i>
                                Enabled
                            </span>
                        </div>
                    </div>

                    <!-- TOTP Setup Flow -->
                    <div x-show="showTotpSetup" x-cloak class="border-t border-gray-100 pt-6 mt-6">
                        <!-- Loading -->
                        <div x-show="totpLoading" class="text-center py-8">
                            <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-gray-400 mx-auto"></i>
                            <p class="text-sm text-gray-500 mt-2">Generating secure key...</p>
                        </div>

                        <!-- QR Code Display -->
                        <div x-show="!totpLoading && totpQrCode" class="space-y-6">
                            <div class="bg-gray-50 rounded-xl p-6 text-center">
                                <p class="text-sm font-medium text-gray-700 mb-4">
                                    Scan this QR code with your authenticator app:
                                </p>
                                <img :src="totpQrCode" alt="TOTP QR Code" class="mx-auto w-48 h-48 rounded-lg shadow-sm">
                                
                                <div class="mt-4 text-xs text-gray-500">
                                    <p class="mb-2">Or enter this code manually:</p>
                                    <code class="bg-white px-3 py-1.5 rounded border border-gray-200 font-mono text-gray-800 select-all" x-text="totpSecret"></code>
                                </div>
                            </div>

                            <!-- Verification -->
                            <div class="space-y-4">
                                <label class="block text-sm font-semibold text-gray-700">
                                    Enter the 6-digit code from your authenticator app:
                                </label>
                                <div class="flex gap-4">
                                    <input 
                                        type="text" 
                                        x-model="totpVerifyCode"
                                        inputmode="numeric"
                                        pattern="[0-9]*"
                                        maxlength="6"
                                        placeholder="000000"
                                        class="flex-grow bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium tracking-widest text-center text-lg"
                                    >
                                    <button 
                                        @click="verifyTotp()"
                                        :disabled="totpVerifyCode.length !== 6 || totpVerifying"
                                        class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <template x-if="!totpVerifying">
                                            <span class="flex items-center gap-2">
                                                <i data-lucide="check" class="w-4 h-4"></i>
                                                Verify & Enable
                                            </span>
                                        </template>
                                        <template x-if="totpVerifying">
                                            <span class="flex items-center gap-2">
                                                <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
                                                Verifying...
                                            </span>
                                        </template>
                                    </button>
                                </div>
                                <div x-show="totpError" x-cloak class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-center gap-2">
                                    <i data-lucide="alert-circle" class="w-4 h-4"></i>
                                    <span x-text="totpError"></span>
                                </div>
                                <button 
                                    @click="cancelTotpSetup()"
                                    class="text-sm text-gray-500 hover:text-gray-700 underline"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Disable 2FA -->
                    <div x-show="totpEnabled && !showTotpSetup" x-cloak class="border-t border-gray-100 pt-6 mt-6">
                        <div x-show="!showDisableTotp">
                            <button 
                                @click="showDisableTotp = true"
                                class="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-2"
                            >
                                <i data-lucide="shield-off" class="w-4 h-4"></i>
                                Disable two-factor authentication
                            </button>
                        </div>
                        <div x-show="showDisableTotp" class="space-y-4">
                            <p class="text-sm text-gray-600">
                                Enter your current authenticator code to disable 2FA:
                            </p>
                            <div class="flex gap-4">
                                <input 
                                    type="text" 
                                    x-model="totpDisableCode"
                                    inputmode="numeric"
                                    pattern="[0-9]*"
                                    maxlength="6"
                                    placeholder="000000"
                                    class="flex-grow bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium tracking-widest text-center text-lg"
                                >
                                <button 
                                    @click="disableTotp()"
                                    :disabled="totpDisableCode.length !== 6 || totpDisabling"
                                    class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <template x-if="!totpDisabling">
                                        <span>Disable 2FA</span>
                                    </template>
                                    <template x-if="totpDisabling">
                                        <span class="flex items-center gap-2">
                                            <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
                                            Disabling...
                                        </span>
                                    </template>
                                </button>
                            </div>
                            <div x-show="totpError" x-cloak class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-center gap-2">
                                <i data-lucide="alert-circle" class="w-4 h-4"></i>
                                <span x-text="totpError"></span>
                            </div>
                            <button 
                                @click="showDisableTotp = false; totpDisableCode = ''; totpError = ''"
                                class="text-sm text-gray-500 hover:text-gray-700 underline"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('alpine:init', () => {
            Alpine.data('holdButton', (action) => ({
                progress: 0,
                interval: null,
                start() {
                    this.progress = 0
                    this.interval = setInterval(() => {
                        this.progress += 1
                        if (this.progress >= 100) {
                            this.trigger()
                        }
                    }, 30)
                },
                stop() {
                    clearInterval(this.interval)
                    this.progress = 0
                },
                trigger() {
                    this.stop()
                    action()
                }
            }))
        })

        function backupApp() {
            return {
                activeTab: 'dashboard',
                loading: false,
                loadingFiles: false,
                lastBackup: null,
                files: [],
                groups: [],
                logs: [],
                config: ${JSON.stringify(config)},
                cronStatus: ${JSON.stringify(jobStatus)},
                configForm: { ...${JSON.stringify(config)} },
                
                // TOTP State
                totpEnabled: ${!!config.auth?.totpSecret},
                showTotpSetup: false,
                showDisableTotp: false,
                totpLoading: false,
                totpVerifying: false,
                totpDisabling: false,
                totpSecret: '',
                totpQrCode: '',
                totpVerifyCode: '',
                totpDisableCode: '',
                totpError: '',

                init() {
                    this.$nextTick(() => {
                        lucide.createIcons()
                    })
                },
                
                // TOTP Methods
                async generateTotp() {
                    this.showTotpSetup = true;
                    this.totpLoading = true;
                    this.totpError = '';
                    this.$nextTick(() => lucide.createIcons());
                    
                    try {
                        const response = await fetch('/backup/api/totp/generate', { method: 'POST' });
                        const data = await response.json();
                        
                        if (data.status === 'success') {
                            this.totpSecret = data.secret;
                            this.totpQrCode = data.qrCode;
                        } else {
                            this.totpError = data.message || 'Failed to generate TOTP';
                        }
                    } catch (err) {
                        this.totpError = 'Connection failed. Please try again.';
                    } finally {
                        this.totpLoading = false;
                        this.$nextTick(() => lucide.createIcons());
                    }
                },
                
                async verifyTotp() {
                    this.totpVerifying = true;
                    this.totpError = '';
                    
                    try {
                        const response = await fetch('/backup/api/totp/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                secret: this.totpSecret,
                                code: this.totpVerifyCode
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.status === 'success') {
                            this.totpEnabled = true;
                            this.showTotpSetup = false;
                            this.totpSecret = '';
                            this.totpQrCode = '';
                            this.totpVerifyCode = '';
                            this.addLog('Two-factor authentication enabled', 'success');
                        } else {
                            this.totpError = data.message || 'Verification failed';
                        }
                    } catch (err) {
                        this.totpError = 'Connection failed. Please try again.';
                    } finally {
                        this.totpVerifying = false;
                        this.$nextTick(() => lucide.createIcons());
                    }
                },
                
                cancelTotpSetup() {
                    this.showTotpSetup = false;
                    this.totpSecret = '';
                    this.totpQrCode = '';
                    this.totpVerifyCode = '';
                    this.totpError = '';
                    this.$nextTick(() => lucide.createIcons());
                },
                
                async disableTotp() {
                    this.totpDisabling = true;
                    this.totpError = '';
                    
                    try {
                        const response = await fetch('/backup/api/totp/disable', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code: this.totpDisableCode })
                        });
                        
                        const data = await response.json();
                        
                        if (data.status === 'success') {
                            this.totpEnabled = false;
                            this.showDisableTotp = false;
                            this.totpDisableCode = '';
                            this.addLog('Two-factor authentication disabled', 'info');
                        } else {
                            this.totpError = data.message || 'Failed to disable 2FA';
                        }
                    } catch (err) {
                        this.totpError = 'Connection failed. Please try again.';
                    } finally {
                        this.totpDisabling = false;
                        this.$nextTick(() => lucide.createIcons());
                    }
                },

                addLog(message, type = 'info') {
                    this.logs.unshift({
                        id: Date.now(),
                        message,
                        type,
                        time: new Date().toLocaleTimeString()
                    })
                    this.$nextTick(() => lucide.createIcons())
                },

                formatBytes(bytes, decimals = 2) {
                    if (!+bytes) return '0 Bytes'
                    const k = 1024
                    const dm = decimals < 0 ? 0 : decimals
                    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB']
                    const i = Math.floor(Math.log(bytes) / Math.log(k))
                    return \`\${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} \${sizes[i]}\`
                },

                formatDateHeader(dateStr) {
                    if (dateStr === 'Others') return 'Others';
                    const [y, m, d] = dateStr.split('-').map(Number);
                    const date = new Date(y, m - 1, d);
                    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                },

                async runBackup() {
                    this.loading = true
                    
                    const now = new Date()
                    const timestamp = now.getFullYear() + '-' +
                        String(now.getMonth() + 1).padStart(2, '0') + '-' +
                        String(now.getDate()).padStart(2, '0') + '_' +
                        String(now.getHours()).padStart(2, '0') + '-' +
                        String(now.getMinutes()).padStart(2, '0') + '-' +
                        String(now.getSeconds()).padStart(2, '0')

                    try {
                        const res = await fetch('/backup/api/run', { 
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ timestamp })
                        })
                        const data = await res.json()
                        if (data.status === 'success') {
                            this.lastBackup = new Date().toLocaleString()
                            this.addLog('Backup completed successfully', 'success')
                            this.fetchFiles()
                        } else {
                            throw new Error(data.message)
                        }
                    } catch (err) {
                        this.addLog('Backup failed: ' + err.message, 'error')
                    } finally {
                        this.loading = false
                    }
                },

                async fetchFiles() {
                    this.loadingFiles = true
                    try {
                        const res = await fetch('/backup/api/files')
                        const data = await res.json()
                        if (data.files) {
                            const sortedFiles = data.files.sort((a, b) => b.key.localeCompare(a.key));
                            
                            const groupsMap = {};
                            sortedFiles.forEach(file => {
                                const match = file.key.match(/(?:^|\\/)(\\d{4}-\\d{2}-\\d{2})[_T]/);
                                const dateKey = match ? match[1] : 'Others';
                                
                                if (!groupsMap[dateKey]) {
                                    groupsMap[dateKey] = [];
                                }
                                groupsMap[dateKey].push(file);
                            });

                            this.groups = Object.keys(groupsMap)
                                .sort()
                                .reverse()
                                .map((dateKey, index) => ({
                                    name: dateKey,
                                    files: groupsMap[dateKey],
                                    expanded: false
                                }));

                            this.$nextTick(() => lucide.createIcons())
                        }
                    } catch (err) {
                        this.addLog('Failed to fetch files: ' + err.message, 'error')
                    } finally {
                        this.loadingFiles = false
                    }
                },

                async restoreFile(key) {
                    try {
                        const res = await fetch('/backup/api/restore', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ key })
                        })
                        const data = await res.json()
                        if (data.status === 'success') {
                            this.addLog(data.message, 'success')
                        } else {
                            throw new Error(data.message)
                        }
                    } catch (err) {
                        this.addLog('Restore failed: ' + err.message, 'error')
                    }
                },

                async deleteFile(key) {
                    try {
                        const res = await fetch('/backup/api/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ key })
                        })
                        const data = await res.json()
                        if (data.status === 'success') {
                            this.addLog(data.message, 'success')
                            this.fetchFiles()
                        } else {
                            throw new Error(data.message)
                        }
                    } catch (err) {
                        this.addLog('Delete failed: ' + err.message, 'error')
                    }
                },

                async saveConfig() {
                    try {
                        const res = await fetch('/backup/api/config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(this.configForm)
                        })
                        const data = await res.json()
                        if (data.status === 'success') {
                            this.config = data.config
                            if (data.jobStatus) this.cronStatus = data.jobStatus
                            this.addLog('Configuration updated', 'success')
                            this.activeTab = 'dashboard'
                        }
                    } catch (err) {
                        this.addLog('Failed to save config: ' + err.message, 'error')
                    }
                },

                async logout() {
                    try {
                        await fetch('/backup/auth/logout', { method: 'POST' });
                        window.location.href = '/backup/login';
                    } catch (err) {
                        console.error('Logout failed:', err);
                        window.location.href = '/backup/login';
                    }
                }
            }
        }
    </script>
</body>
</html>
`
