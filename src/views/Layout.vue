<template>
  <div class="layout-container">
    <el-container class="layout-shell">
      <!-- 侧边栏 -->
      <el-aside width="200px" class="aside-menu">
        <div class="logo">
          <h2>IMS系统</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Monitor /></el-icon>
            <span>控制台</span>
          </el-menu-item>
          <el-sub-menu index="order">
            <template #title>
              <el-icon><ShoppingCart /></el-icon>
              <span>工单管理</span>
            </template>
            <el-menu-item index="/order/order">
              <span>工单列表</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="material">
            <template #title>
              <el-icon><Goods /></el-icon>
              <span>物料管理</span>
            </template>
            <el-menu-item index="/material/material">
              <span>物料信息</span>
            </el-menu-item>
            <el-menu-item index="/material/supplier">
              <span>供应商</span>
            </el-menu-item>
            <el-menu-item index="/material/customer">
              <span>客户</span>
            </el-menu-item>
            <el-menu-item index="/material/lot">
              <span>进货批次管理</span>
            </el-menu-item>
            <el-menu-item index="/material/product">
              <span>产品管理</span>
            </el-menu-item>
            <el-menu-item index="/material/stock">
              <span>库存查询</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="base">
            <template #title>
              <el-icon><DocumentCopy /></el-icon>
              <span>基础管理</span>
            </template>
            <el-menu-item index="/base/recipe">
              <span>配方管理</span>
            </el-menu-item>
            <el-menu-item index="/craft/craft">
              <span>工艺方案</span>
            </el-menu-item>
            <el-menu-item index="/equipment/station">
              <span>工位管理</span>
            </el-menu-item>
            <el-menu-item index="/equipment/device">
              <span>设备管理</span>
            </el-menu-item>
            <el-menu-item index="/base/alarm">
              <span>异常报警</span>
            </el-menu-item>
            <el-menu-item index="/base/ai">
              <span>AI辅助决策</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/system/user">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/system/role">
              <el-icon><UserFilled /></el-icon>
              <span>角色管理</span>
            </el-menu-item>
            <el-menu-item index="/system/menu">
              <el-icon><Menu /></el-icon>
              <span>菜单管理</span>
            </el-menu-item>
            <el-menu-item index="/system/dict-type">
              <el-icon><Collection /></el-icon>
              <span>字典管理</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <!-- 主体内容 -->
      <el-container class="content-shell">
        <!-- 顶部导航 -->
        <el-header class="header">
          <div class="header-content">
            <div class="breadcrumb">
              <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
                <el-breadcrumb-item v-if="currentRoute">{{ currentRoute }}</el-breadcrumb-item>
              </el-breadcrumb>
            </div>
            <div class="user-info">
              <el-dropdown @command="handleCommand">
                <span class="user-name">
                  <el-icon><Avatar /></el-icon>
                  管理员
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>

        <!-- 主内容区 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import {
  ArrowDown,
  Avatar,
  Collection,
  DocumentCopy,
  Goods,
  Menu,
  Monitor,
  Setting,
  ShoppingCart,
  User,
  UserFilled,
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const currentRoute = computed(() => {
  const routeMap: Record<string, string> = {
    '/dashboard': '控制台',
    '/system/user': '用户管理',
    '/system/role': '角色管理',
    '/system/menu': '菜单管理',
    '/system/dict-type': '字典管理',
    '/material/material': '物料信息',
    '/material/supplier': '供应商管理',
    '/material/customer': '客户管理',
    '/material/lot': '进货批次管理',
    '/material/product': '产品管理',
    '/material/stock': '库存查询',
    '/base/recipe': '配方管理',
    '/base/alarm': '异常报警',
    '/base/ai': 'AI辅助决策',
    '/order/order': '工单管理',
    '/equipment/station': '工位管理',
    '/equipment/device': '设备管理',
  }
  return routeMap[route.path] || ''
})

const handleCommand = (command: string) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      userStore.clearUserInfo()
      router.push('/login')
    })
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  overflow: hidden;
}

.layout-shell {
  height: 100%;
}

.aside-menu {
  background-color: #304156;
  height: 100%;
  overflow-y: auto;
}

.content-shell {
  height: 100%;
  min-width: 0;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3a4a;
}

.logo h2 {
  color: #fff;
  font-size: 20px;
  margin: 0;
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.main-content {
  background-color: #f0f2f5;
  height: calc(100vh - 60px);
  overflow-y: auto;
}
</style>
