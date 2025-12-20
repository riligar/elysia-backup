/**
 * Settings tab component with configuration form
 * @returns {string} HTML string
 */
export const SettingsTab = () => `
    <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10">
        <h2 class="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <i data-lucide="sliders" class="w-5 h-5"></i>
            Configuration
        </h2>
        <form @submit.prevent="saveConfig" class="space-y-8">
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Endpoint URL</label>
                    <input type="text" x-model="configForm.endpoint" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium">
                </div>
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Bucket Name</label>
                        <input type="text" x-model="configForm.bucket" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Prefix (Folder)</label>
                        <input type="text" x-model="configForm.prefix" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Source Directory (Local)</label>
                    <input type="text" x-model="configForm.sourceDir" readonly class="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed focus:outline-none font-medium">
                    <p class="text-xs text-gray-400 mt-1">Defined in server configuration</p>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Allowed Extensions (comma separated)</label>
                    <input type="text" x-model="configForm.extensions" placeholder=".db, .sqlite" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Cron Schedule</label>
                    <div class="flex gap-4 items-center">
                        <div class="relative flex-grow">
                            <input type="text" x-model="configForm.cronSchedule" placeholder="0 0 * * *" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium">
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
                        <input type="text" x-model="configForm.accessKeyId" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Secret Access Key</label>
                        <input type="password" x-model="configForm.secretAccessKey" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium">
                    </div>
                </div>
            </div>
            
            <div class="pt-4 flex justify-end">
                <button type="submit" class="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2">
                    <i data-lucide="save" class="w-4 h-4"></i>
                    Save Changes
                </button>
            </div>
        </form>
    </div>
`
