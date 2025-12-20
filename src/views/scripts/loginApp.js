/**
 * Alpine.js login app logic
 * @param {{ totpEnabled: boolean }} props
 * @returns {string} JavaScript code string
 */
export const loginAppScript = ({ totpEnabled }) => `
    <script>
        document.addEventListener('alpine:init', () => {
            Alpine.data('loginApp', () => ({
                username: '',
                password: '',
                totpCode: '',
                totpEnabled: ${totpEnabled},
                loading: false,
                error: '',

                init() {
                    this.$nextTick(() => lucide.createIcons());
                },

                async login() {
                    this.loading = true;
                    this.error = '';

                    try {
                        const payload = {
                            username: this.username,
                            password: this.password
                        };
                        
                        if (this.totpEnabled && this.totpCode) {
                            payload.totpCode = this.totpCode;
                        }

                        const response = await fetch('/backup/auth/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        const data = await response.json();

                        if (response.ok && data.status === 'success') {
                            window.location.href = '/backup';
                        } else {
                            this.error = data.message || 'Invalid credentials';
                            this.$nextTick(() => lucide.createIcons());
                        }
                    } catch (err) {
                        this.error = 'Connection failed. Please try again.';
                        this.$nextTick(() => lucide.createIcons());
                    } finally {
                        this.loading = false;
                        this.$nextTick(() => lucide.createIcons());
                    }
                }
            }));
        });
    </script>
`
