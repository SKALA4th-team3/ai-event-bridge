import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import '@/assets/styles/tokens.css'
import '@/assets/styles/base.css'
import '@/assets/styles/app.css'
import { installFocusTrap } from '@/composables/useFocusTrap.js'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

installFocusTrap()
