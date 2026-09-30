import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'canvas', component: () => import('@/pages/HomePage.vue') },
    { path: '/:pathMatch(.*)*', redirect: { name: 'canvas' } },
  ],
})

export default router
