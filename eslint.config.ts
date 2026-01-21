import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
// 1. 导入插件生成的配置文件
import autoImportConfigs from './.eslintrc-auto-import.json' with { type: 'json' }

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/base-setup',
    settings: {
      // 2. 将生成的全局变量配置注入
      globals: {
        ...autoImportConfigs.globals,
      },
    },
  },

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
)
