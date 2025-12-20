/**
 * Action area component with backup button and activity logs
 * @returns {string} HTML string
 */
export const ActionArea = () => `
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
`
