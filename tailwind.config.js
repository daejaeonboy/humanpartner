/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#39B54A',
                    50: '#EEF9EF',
                    100: '#D7F0DB',
                    200: '#B3E2B9',
                    300: '#8DD597',
                    400: '#63C86F',
                    500: '#39B54A',    // Main brand color
                    600: '#2F9A3F',
                    700: '#247A30',
                    800: '#194F21',
                    900: '#0E2911',
                }
            },
            keyframes: {
                slideInRight: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                }
            },
            animation: {
                slideInRight: 'slideInRight 0.3s ease-out forwards',
                fadeIn: 'fadeIn 0.2s ease-out forwards',
            }
        },
    },
    plugins: [
        require('tailwind-scrollbar-hide')
    ],
}
