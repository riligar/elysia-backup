/**
 * Onboarding card component - Multi-step setup wizard
 * @param {{ sourceDir: string }} props
 * @returns {string} HTML string
 */
export const OnboardingCard = ({ sourceDir }) => `
    <div class="w-full max-w-2xl" x-data="onboardingApp()">
        <!-- Onboarding Card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden">
            <!-- Header -->
            <div class="p-8 text-center border-b border-gray-100 bg-gradient-to-br from-primary-50 to-white">
                <img src="/backup/logo.png" alt="Backup Manager" class="w-16 h-16 mx-auto mb-4 rounded-xl">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">Welcome to Backup Manager</h1>
                <p class="text-sm text-gray-500">Let's configure your backup system in a few steps</p>
            </div>

            <!-- Progress Steps -->
            <div class="px-8 py-4 bg-gray-50 border-b border-gray-100">
                <div class="flex items-center justify-center gap-2">
                    <template x-for="(stepName, index) in ['Storage', 'Backup', 'Security']" :key="index">
                        <div class="flex items-center">
                            <div 
                                :class="step > index + 1 ? 'bg-primary-500 text-white' : (step === index + 1 ? 'bg-primary-500 text-white ring-4 ring-primary-100' : 'bg-gray-200 text-gray-500')"
                                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                            >
                                <span x-show="step <= index + 1" x-text="index + 1"></span>
                                <i x-show="step > index + 1" data-lucide="check" class="w-4 h-4"></i>
                            </div>
                            <span 
                                :class="step >= index + 1 ? 'text-gray-900 font-semibold' : 'text-gray-400'"
                                class="ml-2 text-sm hidden sm:inline"
                                x-text="stepName"
                            ></span>
                            <div x-show="index < 2" class="w-8 h-0.5 mx-3 bg-gray-200 hidden sm:block">
                                <div 
                                    :class="step > index + 1 ? 'w-full' : 'w-0'"
                                    class="h-full bg-primary-500 transition-all duration-300"
                                ></div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Form -->
            <div class="p-8">
                <!-- Error Message -->
                <div x-show="error" x-cloak class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div class="flex items-center gap-3">
                        <i data-lucide="alert-circle" class="w-5 h-5 text-red-600"></i>
                        <span class="text-sm text-red-800 font-medium" x-text="error"></span>
                    </div>
                </div>

                <!-- Step 1: Storage Configuration -->
                <div x-show="step === 1" x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 translate-x-4" x-transition:enter-end="opacity-100 translate-x-0">
                    <h2 class="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <i data-lucide="cloud" class="w-5 h-5 text-primary-500"></i>
                        Storage Configuration
                    </h2>
                    <p class="text-sm text-gray-500 mb-6">Configure your R2/S3 compatible storage</p>

                    <div class="space-y-5">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Endpoint URL *</label>
                            <input 
                                type="url" 
                                x-model="form.endpoint"
                                placeholder="https://your-account.r2.cloudflarestorage.com"
                                class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                            >
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Bucket Name *</label>
                                <input 
                                    type="text" 
                                    x-model="form.bucket"
                                    placeholder="my-backups"
                                    class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                                >
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Prefix (Folder)</label>
                                <input 
                                    type="text" 
                                    x-model="form.prefix"
                                    placeholder="backups/"
                                    class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                                >
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Access Key ID *</label>
                                <input 
                                    type="text" 
                                    x-model="form.accessKeyId"
                                    placeholder="Your access key"
                                    class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                                >
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Secret Access Key *</label>
                                <input 
                                    type="password" 
                                    x-model="form.secretAccessKey"
                                    placeholder="Your secret key"
                                    class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                                >
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Backup Configuration -->
                <div x-show="step === 2" x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 translate-x-4" x-transition:enter-end="opacity-100 translate-x-0">
                    <h2 class="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <i data-lucide="hard-drive" class="w-5 h-5 text-primary-500"></i>
                        Backup Configuration
                    </h2>
                    <p class="text-sm text-gray-500 mb-6">Configure backup source and schedule</p>

                    <div class="space-y-5">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Source Directory</label>
                            <input 
                                type="text" 
                                value="${sourceDir}"
                                disabled
                                class="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed font-medium"
                            >
                            <p class="text-xs text-gray-400 mt-1">Defined in server configuration</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Allowed Extensions</label>
                            <input 
                                type="text" 
                                x-model="form.extensions"
                                placeholder=".db, .sqlite, .json (leave empty for all files)"
                                class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                            >
                            <p class="text-xs text-gray-400 mt-1">Comma-separated list of file extensions to backup</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Cron Schedule</label>
                            <input 
                                type="text" 
                                x-model="form.cronSchedule"
                                placeholder="0 0 * * * (daily at midnight)"
                                class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                            >
                            <p class="text-xs text-gray-400 mt-1">
                                Format: Minute Hour Day Month DayOfWeek. 
                                <a href="https://crontab.guru/" target="_blank" class="text-primary-500 hover:underline">Help</a>
                            </p>
                        </div>
                        <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <input 
                                type="checkbox" 
                                x-model="form.cronEnabled"
                                id="cronEnabled"
                                class="w-5 h-5 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
                            >
                            <label for="cronEnabled" class="text-sm font-medium text-gray-700">Enable scheduled backups</label>
                        </div>
                    </div>
                </div>

                <!-- Step 3: Security Configuration -->
                <div x-show="step === 3" x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 translate-x-4" x-transition:enter-end="opacity-100 translate-x-0">
                    <h2 class="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <i data-lucide="shield" class="w-5 h-5 text-primary-500"></i>
                        Security Configuration
                    </h2>
                    <p class="text-sm text-gray-500 mb-6">Set up your admin credentials</p>

                    <div class="space-y-5">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Admin Username *</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <i data-lucide="user" class="w-5 h-5 text-gray-400"></i>
                                </div>
                                <input 
                                    type="text" 
                                    x-model="form.username"
                                    placeholder="admin"
                                    class="w-full bg-gray-50 border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                                >
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <i data-lucide="lock" class="w-5 h-5 text-gray-400"></i>
                                </div>
                                <input 
                                    type="password" 
                                    x-model="form.password"
                                    placeholder="Enter a strong password"
                                    class="w-full bg-gray-50 border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                                >
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <i data-lucide="lock" class="w-5 h-5 text-gray-400"></i>
                                </div>
                                <input 
                                    type="password" 
                                    x-model="form.confirmPassword"
                                    placeholder="Confirm your password"
                                    class="w-full bg-gray-50 border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                                    :class="form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-300 focus:ring-red-500' : ''"
                                >
                            </div>
                            <p x-show="form.confirmPassword && form.password !== form.confirmPassword" class="text-xs text-red-500 mt-1">
                                Passwords do not match
                            </p>
                        </div>

                        <div class="p-4 bg-primary-50 rounded-lg border border-primary-100">
                            <div class="flex items-start gap-3">
                                <i data-lucide="info" class="w-5 h-5 text-primary-600 mt-0.5"></i>
                                <div class="text-sm text-primary-800">
                                    <p class="font-medium mb-1">Two-Factor Authentication</p>
                                    <p class="text-primary-700">You can enable 2FA later in the Security settings after completing the setup.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Navigation Buttons -->
                <div class="flex justify-between mt-8 pt-6 border-t border-gray-100">
                    <button 
                        x-show="step > 1"
                        @click="prevStep()"
                        class="px-6 py-3 text-gray-600 hover:text-gray-900 font-semibold transition-colors flex items-center gap-2"
                    >
                        <i data-lucide="arrow-left" class="w-4 h-4"></i>
                        Back
                    </button>
                    <div x-show="step === 1"></div>

                    <button 
                        x-show="step < 3"
                        @click="nextStep()"
                        class="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        Continue
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>

                    <button 
                        x-show="step === 3"
                        @click="submitSetup()"
                        :disabled="loading || !canSubmit()"
                        class="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span x-show="!loading" class="flex items-center gap-2">
                            <i data-lucide="check-circle" class="w-5 h-5"></i>
                            Complete Setup
                        </span>
                        <span x-show="loading" class="flex items-center gap-2">
                            <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
                            Saving...
                        </span>
                    </button>
                </div>
            </div>
        </div>
    </div>
`
