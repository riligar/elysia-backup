/**
 * Status cards component for dashboard overview
 * @returns {string} HTML string
 */
export const StatusCards = () => `
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
`
