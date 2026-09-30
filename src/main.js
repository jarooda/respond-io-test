import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

import './assets/main.css'
import App from './App.vue'
import router from './router'
import { queryClientConfig } from './config/query'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, { queryClientConfig })

app.mount('#app')
