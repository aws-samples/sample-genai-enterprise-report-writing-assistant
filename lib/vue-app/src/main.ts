/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'
import { Amplify } from 'aws-amplify'
import '@aws-amplify/ui-vue/styles.css'
import amplifyConfig from './config/amplify'

// Composables
import { createApp } from 'vue'

Amplify.configure(amplifyConfig)

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
