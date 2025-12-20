/**
 * Onboarding Alpine.js application script
 * Handles multi-step form navigation and submission
 * @param {{ sourceDir: string }} props
 * @returns {string} Script tag with onboarding logic
 */
export const onboardingAppScript = ({ sourceDir }) => `
<script>
    document.addEventListener('alpine:init', () => {
        Alpine.data('onboardingApp', () => ({
            step: 1,
            loading: false,
            error: '',
            form: {
                // Storage
                endpoint: '',
                bucket: '',
                prefix: '',
                accessKeyId: '',
                secretAccessKey: '',
                // Backup
                extensions: '',
                cronSchedule: '0 0 * * *',
                cronEnabled: true,
                // Security
                username: '',
                password: '',
                confirmPassword: ''
            },

            init() {
                this.$nextTick(() => lucide.createIcons());
            },

            validateStep1() {
                if (!this.form.endpoint) {
                    this.error = 'Endpoint URL is required';
                    return false;
                }
                if (!this.form.bucket) {
                    this.error = 'Bucket name is required';
                    return false;
                }
                if (!this.form.accessKeyId) {
                    this.error = 'Access Key ID is required';
                    return false;
                }
                if (!this.form.secretAccessKey) {
                    this.error = 'Secret Access Key is required';
                    return false;
                }
                return true;
            },

            validateStep2() {
                // Step 2 has no required fields
                return true;
            },

            validateStep3() {
                if (!this.form.username) {
                    this.error = 'Username is required';
                    return false;
                }
                if (!this.form.password) {
                    this.error = 'Password is required';
                    return false;
                }
                if (this.form.password.length < 8) {
                    this.error = 'Password must be at least 8 characters';
                    return false;
                }
                if (this.form.password !== this.form.confirmPassword) {
                    this.error = 'Passwords do not match';
                    return false;
                }
                return true;
            },

            nextStep() {
                this.error = '';
                
                if (this.step === 1 && !this.validateStep1()) return;
                if (this.step === 2 && !this.validateStep2()) return;
                
                this.step++;
                this.$nextTick(() => lucide.createIcons());
            },

            prevStep() {
                this.error = '';
                this.step--;
                this.$nextTick(() => lucide.createIcons());
            },

            canSubmit() {
                return this.form.username && 
                       this.form.password && 
                       this.form.password === this.form.confirmPassword &&
                       this.form.password.length >= 8;
            },

            async submitSetup() {
                this.error = '';
                
                if (!this.validateStep3()) return;

                this.loading = true;

                try {
                    const response = await fetch('/backup/api/onboarding', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            endpoint: this.form.endpoint,
                            bucket: this.form.bucket,
                            prefix: this.form.prefix,
                            accessKeyId: this.form.accessKeyId,
                            secretAccessKey: this.form.secretAccessKey,
                            extensions: this.form.extensions,
                            cronSchedule: this.form.cronSchedule,
                            cronEnabled: this.form.cronEnabled,
                            username: this.form.username,
                            password: this.form.password
                        })
                    });

                    const data = await response.json();

                    if (data.status === 'success') {
                        window.location.href = '/backup';
                    } else {
                        this.error = data.message || 'Setup failed. Please try again.';
                    }
                } catch (e) {
                    this.error = 'Connection error. Please try again.';
                } finally {
                    this.loading = false;
                    this.$nextTick(() => lucide.createIcons());
                }
            }
        }));
    });

    document.addEventListener('DOMContentLoaded', () => {
        lucide.createIcons();
    });
</script>
`
