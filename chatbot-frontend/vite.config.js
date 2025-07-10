import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// During dev (`npm run dev`), proxy `/api` and `/auth` to backend URL from env
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    base: '/',
  }
  if (command === 'serve') {
    config.server = {
      proxy: {
        '/api': {
          target: import.meta.env.VITE_CHATBOT_URL,
          changeOrigin: true,
          secure: false,
        },
        '/auth': {
          target: import.meta.env.VITE_AUTHENTICATION_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    }
  }
  return config
})
