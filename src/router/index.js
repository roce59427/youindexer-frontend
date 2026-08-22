import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/results',
      name: 'search-results',
      component: () => import('../views/SearchResultsView.vue')
    },
    {
      path: '/video',
      name: 'video-insight',
      component: () => import('../views/VideoInsightView.vue')
    }
  ]
})

export default router
