/**
 * Alpine.js backup app logic
 * @param {{ config: object, jobStatus: object }} props
 * @returns {string} JavaScript code string
 */
export const backupAppScript = ({ config, jobStatus }) => `
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
                        
                        // Handle session expiration
                        if (res.status === 401) {
                            this.addLog('Session expired. Redirecting to login...', 'error')
                            setTimeout(() => window.location.href = '/backup/login', 1500)
                            return
                        }
                        
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
                        
                        // Handle session expiration
                        if (res.status === 401) {
                            this.addLog('Session expired. Redirecting to login...', 'error')
                            setTimeout(() => window.location.href = '/backup/login', 1500)
                            return
                        }
                        
                        const data = await res.json()
                        
                        // Check for error response
                        if (data.status === 'error') {
                            throw new Error(data.message)
                        }
                        
                        if (data.files) {
                            const sortedFiles = data.files.sort((a, b) => b.key.localeCompare(a.key));
                            
                            const groupsMap = {};
                            sortedFiles.forEach(file => {
                                // Try to extract date from folder path first (new format: YYYY-MM-DD/)
                                // Then fall back to extracting from filename (legacy format: YYYY-MM-DD_HH-mm-ss_filename)
                                const folderMatch = file.key.match(/(?:^|\\/)(\\d{4}-\\d{2}-\\d{2})\\//);
                                const filenameMatch = file.key.match(/(?:^|\\/)(\\d{4}-\\d{2}-\\d{2})[_T]/);
                                const dateKey = folderMatch ? folderMatch[1] : (filenameMatch ? filenameMatch[1] : 'Others');
                                
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
                        
                        // Handle session expiration
                        if (res.status === 401) {
                            this.addLog('Session expired. Redirecting to login...', 'error')
                            setTimeout(() => window.location.href = '/backup/login', 1500)
                            return
                        }
                        
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
                        
                        // Handle session expiration
                        if (res.status === 401) {
                            this.addLog('Session expired. Redirecting to login...', 'error')
                            setTimeout(() => window.location.href = '/backup/login', 1500)
                            return
                        }
                        
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
                        
                        // Handle session expiration
                        if (res.status === 401) {
                            this.addLog('Session expired. Redirecting to login...', 'error')
                            setTimeout(() => window.location.href = '/backup/login', 1500)
                            return
                        }
                        
                        const data = await res.json()
                        if (data.status === 'success') {
                            this.config = data.config
                            if (data.jobStatus) this.cronStatus = data.jobStatus
                            this.addLog('Configuration updated', 'success')
                            this.activeTab = 'dashboard'
                        } else {
                            throw new Error(data.message || 'Failed to save config')
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
`
