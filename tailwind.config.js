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
                    50: '#F3FCF4',
                    100: '#DFF6E3',
                    200: '#C1EDC8',
                    300: '#93DE9D',
                    400: '#5ECA68',
                    500: '#39B54A',    // Main brand color
                    600: '#2F963D',
                    700: '#287732',
                    800: '#255F2C',
                    900: '#204E27',
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
