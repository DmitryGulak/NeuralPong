import Vue from 'vue'
import Router from 'vue-router'
import GameField from '@/components/GameField'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'game-field',
      component: GameField
    }
  ]
})
