import Layout from '@/views/Layout.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
    },
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
        },
        {
          path: 'system/user',
          name: 'UserManagement',
          component: () => import('@/views/UserManagement.vue'),
        },
        {
          path: 'system/role',
          name: 'RoleManagement',
          component: () => import('@/views/RoleManagement.vue'),
        },
        {
          path: 'system/menu',
          name: 'MenuManagement',
          component: () => import('@/views/MenuManagement.vue'),
        },
        // 物料模块
        {
          path: 'material/material',
          name: 'MaterialManagement',
          component: () => import('@/views/MaterialManagement.vue'),
        },
        {
          path: 'material/supplier',
          name: 'SupplierManagement',
          component: () => import('@/views/SupplierManagement.vue'),
        },
        {
          path: 'material/customer',
          name: 'CustomerManagement',
          component: () => import('@/views/CustomerManagement.vue'),
        },
        {
          path: 'material/lot',
          name: 'MaterialLotManagement',
          component: () => import('@/views/MaterialLotManagement.vue'),
        },
        {
          path: 'material/product',
          name: 'ProductManagement',
          component: () => import('@/views/ProductManagement.vue'),
        },
        {
          path: 'material/stock',
          name: 'MaterialStockManagement',
          component: () => import('@/views/MaterialStockManagement.vue'),
        },
        // 基础模块
        {
          path: 'base/recipe',
          name: 'RecipeManagement',
          component: () => import('@/views/RecipeManagement.vue'),
        },
        {
          path: 'base/recipe/:recipeId/detail',
          name: 'RecipeDetailManagement',
          component: () => import('@/views/RecipeDetailManagement.vue'),
        },
        {
          path: 'base/alarm',
          name: 'AlarmManagement',
          component: () => import('@/views/AlarmManagement.vue'),
        },
        {
          path: 'base/ai',
          name: 'AiAnalysisManagement',
          component: () => import('@/views/AiAnalysisManagement.vue'),
        },
        // 工艺模块
        {
          path: 'craft/craft',
          name: 'CraftManagement',
          component: () => import('@/views/CraftManagement.vue'),
        },
        {
          path: 'craft/craft/:craftId/detail',
          name: 'CraftDetailManagement',
          component: () => import('@/views/CraftDetailManagement.vue'),
        },
        // 工单模块
        {
          path: 'order/order',
          name: 'OrderManagement',
          component: () => import('@/views/OrderManagement.vue'),
        },
        // 字典模块
        {
          path: 'system/dict-type',
          name: 'DictTypeManagement',
          component: () => import('@/views/DictTypeManagement.vue'),
        },
        {
          path: 'system/dict-type/:dictType/data',
          name: 'DictDataManagement',
          component: () => import('@/views/DictDataManagement.vue'),
        },
        // 设备模块
        {
          path: 'equipment/station',
          name: 'StationManagement',
          component: () => import('@/views/StationManagement.vue'),
        },
        {
          path: 'equipment/device',
          name: 'DeviceManagement',
          component: () => import('@/views/DeviceManagement.vue'),
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  // 如果没有token且访问的不是登录页，跳转到登录页
  if (!token && to.path !== '/login') {
    next('/login')
  }
  // 如果有token且访问的是登录页，跳转到首页
  else if (token && to.path === '/login') {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
