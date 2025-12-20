/**
 * Shared HTML head component
 * Contains Tailwind config, Alpine.js, Lucide icons, and fonts
 * @param {{ title: string }} props
 * @returns {string} HTML string for head section
 */
export const Head = ({ title = 'Backup Manager' }) => `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="icon" type="image/x-icon" href="/backup/favicon.ico">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Montserrat', 'sans-serif'],
                    },
                    colors: {
                        primary: {
                            50: '#E8F4FD',
                            100: '#C5E3FA',
                            200: '#9DD0F6',
                            300: '#6DB9F1',
                            400: '#47A7ED',
                            500: '#209CEE',
                            600: '#1A8AD8',
                            700: '#1574B8',
                            800: '#115E95',
                            900: '#0C4A77',
                        },
                        gray: {
                            50: '#F9FAFB',
                            100: '#F3F4F6',
                            200: '#E5E7EB',
                            300: '#D1D5DB',
                            400: '#9CA3AF',
                            500: '#6B7280',
                            600: '#4B5563',
                            700: '#374151',
                            800: '#1F2937',
                            900: '#111827',
                        }
                    }
                }
            }
        }
    </script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        [x-cloak] { display: none !important; }
    </style>
`
