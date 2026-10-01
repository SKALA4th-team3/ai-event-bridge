import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import EventDetailView from './views/EventDetailView.vue'
import KnowledgeAdminView from './views/KnowledgeAdminView.vue'
import './styles.css'
import './forecast-charts.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/events/101' },
    { path: '/events/:eventId', component: EventDetailView },
    { path: '/admin/knowledge', component: KnowledgeAdminView },
  ],
})

createApp(App).use(router).mount('#app')
