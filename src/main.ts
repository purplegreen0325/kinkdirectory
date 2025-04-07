import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import i18n from './i18n'
import ui from '@nuxt/ui/vue-plugin'

createApp(App)
  .use(i18n)
  .use(ui)
  .mount('#app')
