import { createRouter, createWebHistory } from 'vue-router'
import SendView from '../views/SendView.vue'
import ReceiveView from '../views/ReceiveView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      alias: '/',
      path: '/send',
      name: 'send',
      component: SendView
    },
    {
      path: '/receive',
      name: 'receive',
      component: ReceiveView
    }
  ]
})

export default router
