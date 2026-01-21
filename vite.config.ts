import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 1. 引入插件
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // 2. 配置自动导入 API
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: true, // 自动生成 auto-imports.d.ts
      eslintrc: {
        enabled: true, // 生成 .eslintrc-auto-import.json 供 ESLint 使用
      },
    }),
    // 3. 配置自动导入组件
    Components({
      dts: true, // 自动生成 components.d.ts
    }),
  ],
  server: {
    port: 8080,
    open: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})