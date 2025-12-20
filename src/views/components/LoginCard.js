/**
 * Login card component
 * @param {{ totpEnabled: boolean }} props
 * @returns {string} HTML string
 */
export const LoginCard = ({ totpEnabled }) => `
    <div class="w-full max-w-md" x-data="loginApp()">
        <!-- Login Card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden">
            <!-- Header -->
            <div class="p-10 text-center border-b border-gray-100">
                <div class="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="shield-check" class="w-8 h-8 text-white"></i>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2">Backup Manager</h1>
                <p class="text-sm text-gray-500">Access Control Panel</p>
            </div>

            <!-- Form -->
            <div class="p-10">
                <form @submit.prevent="login" class="space-y-6">
                    <!-- Error Message -->
                    <div x-show="error" x-cloak class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-center gap-3">
                            <i data-lucide="alert-circle" class="w-5 h-5 text-red-600"></i>
                            <span class="text-sm text-red-800 font-medium" x-text="error"></span>
                        </div>
                    </div>

                    <!-- Username -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <i data-lucide="user" class="w-5 h-5 text-gray-400"></i>
                            </div>
                            <input 
                                type="text" 
                                x-model="username"
                                required
                                class="w-full bg-gray-50 border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium"
                                placeholder="Enter your username"
                                autofocus
                            >
                        </div>
                    </div>

                    <!-- Password -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <i data-lucide="lock" class="w-5 h-5 text-gray-400"></i>
                            </div>
                            <input 
                                type="password" 
                                x-model="password"
                                required
                                class="w-full bg-gray-50 border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium"
                                placeholder="Enter your password"
                            >
                        </div>
                    </div>

                    <!-- TOTP Code (only shown when TOTP is enabled) -->
                    <div x-show="totpEnabled" x-cloak>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Authenticator Code</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <i data-lucide="smartphone" class="w-5 h-5 text-gray-400"></i>
                            </div>
                            <input 
                                type="text" 
                                x-model="totpCode"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                maxlength="6"
                                :required="totpEnabled"
                                class="w-full bg-gray-50 border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium tracking-widest text-center text-lg"
                                placeholder="000000"
                            >
                        </div>
                        <p class="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <i data-lucide="info" class="w-3 h-3"></i>
                            Enter the 6-digit code from your authenticator app
                        </p>
                    </div>

                    <!-- Submit Button -->
                    <button 
                        type="submit"
                        :disabled="loading"
                        class="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <span x-show="!loading" class="flex items-center gap-2">
                            <span>Sign In</span>
                            <i data-lucide="arrow-right" class="w-5 h-5"></i>
                        </span>
                        <span x-show="loading" class="flex items-center gap-2">
                            <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
                            <span>Authenticating...</span>
                        </span>
                    </button>
                </form>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-6 text-sm text-gray-500">
            <i data-lucide="info" class="w-4 h-4 inline-block mr-1"></i>
            Secure connection required for production use
        </div>
    </div>
`
