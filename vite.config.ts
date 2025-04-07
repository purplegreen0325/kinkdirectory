import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import ui from '@nuxt/ui/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/kinkdirectory',
  plugins: [vue(), tailwindcss(), ui({
    ui: {
      colors: {
        primary: 'rose',
        secondary: 'amber',
        info: 'cyan',
      }
    }
  }), vueDevTools({
    launchEditor:'cursor'
  })],
})
