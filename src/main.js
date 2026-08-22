import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAuth } from './stores/auth.js'

import './assets/main.css'

async function bootstrap() {
  await initAuth()

  const app = createApp(App)
  app.use(router)
  app.mount('#app')
}

bootstrap()
