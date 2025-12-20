/**
 * Files tab component with remote files table
 * @returns {string} HTML string
 */
export const FilesTab = () => `
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
                                            class="relative overflow-hidden px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors select-none"
                                            title="Hold 3s to Restore"
                                        >
                                            <div class="absolute inset-0 bg-primary-200/50 origin-left transition-all duration-0 ease-linear" :style="'width: ' + progress + '%'"></div>
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
`
