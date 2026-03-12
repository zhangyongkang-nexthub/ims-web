<template>
  <div class="dashboard-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统概览</span>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <el-icon size="40" color="#409EFF"><User /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.userCount }}</div>
              <div class="stat-label">用户总数</div>
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <el-icon size="40" color="#67C23A"><UserFilled /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.roleCount }}</div>
              <div class="stat-label">角色总数</div>
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <el-icon size="40" color="#E6A23C"><Menu /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.menuCount }}</div>
              <div class="stat-label">菜单总数</div>
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <el-icon size="40" color="#F56C6C"><Key /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.permCount }}</div>
              <div class="stat-label">权限总数</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <div class="welcome-section">
        <h2>欢迎使用 IMS 管理系统</h2>
        <p>这是一个基于 RBAC 的权限管理系统，包含用户、角色、菜单三大核心模块。</p>
        <el-space wrap>
          <el-tag type="success">Vue 3</el-tag>
          <el-tag type="primary">Element Plus</el-tag>
          <el-tag type="warning">TypeScript</el-tag>
          <el-tag type="danger">Vite</el-tag>
          <el-tag type="info">Pinia</el-tag>
        </el-space>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { getMenuList, getPermissions } from '@/api/menu'
import { getRoleList } from '@/api/role'
import { getUserList } from '@/api/user'
import { Key, Menu, User, UserFilled } from '@element-plus/icons-vue'
import { onMounted, ref } from 'vue'

const stats = ref({
  userCount: 0,
  roleCount: 0,
  menuCount: 0,
  permCount: 0,
})

const loadStats = async () => {
  try {
    // 加载用户统计
    const userRes = await getUserList({ pageNum: 1, pageSize: 1 })
    stats.value.userCount = userRes.data.total

    // 加载角色统计
    const roleRes = await getRoleList()
    stats.value.roleCount = roleRes.data.length

    // 加载菜单统计
    const menuRes = await getMenuList()
    stats.value.menuCount = menuRes.data.length

    // 加载权限统计
    const permRes = await getPermissions()
    stats.value.permCount = permRes.data.length
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.welcome-section {
  padding: 20px 0;
}

.welcome-section h2 {
  font-size: 24px;
  margin: 0 0 16px 0;
  color: #333;
}

.welcome-section p {
  font-size: 14px;
  color: #666;
  margin: 0 0 20px 0;
  line-height: 1.6;
}
</style>
