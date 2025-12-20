/**
 * Security section component with TOTP 2FA setup
 * @returns {string} HTML string
 */
export const SecuritySection = () => `
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
                        class="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2.5 px-5 rounded-lg transition-all flex items-center gap-2"
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
                                class="flex-grow bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium tracking-widest text-center text-lg"
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
                            class="flex-grow bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium tracking-widest text-center text-lg"
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
`
