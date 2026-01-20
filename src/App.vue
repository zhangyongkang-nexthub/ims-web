<template>
  <div
    class="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-900 via-blue-800 to-blue-950 p-4"
  >
    <div class="w-full max-w-md">
      <!-- 毛玻璃登录卡片 -->
      <div class="backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl p-8 border border-white/20">
        <h2 class="text-3xl font-bold text-white text-center mb-8">欢迎登录</h2>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- 用户名输入 -->
          <div>
            <label class="block text-white/80 text-sm font-medium mb-2">用户名</label>
            <input
              v-model="username"
              type="text"
              placeholder="请输入用户名"
              class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
            />
          </div>

          <!-- 密码输入 -->
          <div>
            <label class="block text-white/80 text-sm font-medium mb-2">密码</label>
            <input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
            />
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            class="w-full py-3 px-4 bg-linear-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
          >
            登录
          </button>
        </form>

        <!-- 底部链接 -->
        <div class="mt-6 text-center">
          <a href="#" class="text-white/60 hover:text-white text-sm transition-colors">忘记密码?</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const username = ref<string>('')
const password = ref<string>('')

const handleLogin = (): void => {
  if (!username.value || !password.value) {
    alert('请输入用户名和密码')
    return
  }

  // 这里处理登录逻辑
  console.log('登录信息:', {
    username: username.value,
    password: password.value,
  })

  // 实际项目中，这里应该调用 API
  alert(`欢迎, ${username.value}!`)
}
</script>
