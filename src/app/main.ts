import { createApp } from 'vue'
import App from './App.vue'
import '@/app/assets/scss/style.scss'
import { createPinia } from 'pinia'
import { BackupService } from './services/backup'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)

app.mount('#op-app')

// Initialize backup service after app is mounted
BackupService.getInstance()
  .initAutoBackup()
  .then(() => {
    console.log('StreamFluency initialized with backup service')
  })
  .catch((error) => {
    console.error('Failed to initialize backup service', error)
  })
