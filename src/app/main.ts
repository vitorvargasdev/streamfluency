import { createApp } from 'vue'
import App from './App.vue'
import '@/app/assets/scss/style.scss'
import { createPinia } from 'pinia'
import { BackupService } from './services/backup'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)

app.mount('#op-app')

BackupService.getInstance().initAutoBackup()
