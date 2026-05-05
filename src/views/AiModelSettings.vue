<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>模型配置</span>
          <el-button type="primary" @click="openDialog">新增/修改配置</el-button>
        </div>
      </template>

      <el-empty v-if="!configs.length && !loading" description="暂无模型配置" />

      <el-row :gutter="16" v-loading="loading">
        <el-col v-for="item in configs" :key="item.configId" :xs="24" :sm="12" :md="8">
          <el-card class="model-card" shadow="hover" :class="{ active: item.isActive === 1 }">
            <div class="model-info">
              <div class="model-name">{{ item.configName }}</div>
              <div class="model-detail">模型：{{ item.modelName }}</div>
              <div class="model-detail">Temperature：{{ item.temperature }}</div>
            </div>
            <div class="model-actions">
              <el-tag v-if="item.isActive === 1" type="success" effect="dark">当前激活</el-tag>
              <el-button
                v-else
                type="primary"
                size="small"
                :loading="activatingId === item.configId"
                @click="handleActivate(item)"
              >
                切换为此模型
              </el-button>
              <el-button link type="primary" size="small" @click="handleEditConfig(item)">
                编辑
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="460px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px">
        <el-form-item label="配置名称" prop="configName">
          <el-input v-model="formData.configName" placeholder="如：默认配置" />
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="formData.modelName" placeholder="如：gpt-4o-mini" />
        </el-form-item>
        <el-form-item label="Temperature" prop="temperature">
          <el-slider v-model="formData.temperature" :min="0" :max="2" :step="0.1" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  activateAiModelConfig,
  getAiModelConfigs,
  saveAiModelConfig,
  type AiModelConfig,
  type AiModelConfigForm,
} from '@/api/ai'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增模型配置')
const formRef = ref<FormInstance>()
const configs = ref<AiModelConfig[]>([])
const activatingId = ref<number | null>(null)

const formData = reactive<AiModelConfigForm>({
  configId: undefined,
  configName: '',
  modelName: '',
  temperature: 0.7,
})

const rules = {
  configName: [{ required: true, message: '配置名称不能为空', trigger: 'blur' }],
  modelName: [{ required: true, message: '模型名称不能为空', trigger: 'blur' }],
}

const loadConfigs = async () => {
  loading.value = true
  try {
    const res = await getAiModelConfigs()
    configs.value = res.data
  } finally {
    loading.value = false
  }
}

const openDialog = () => {
  dialogTitle.value = '新增模型配置'
  formData.configId = undefined
  formData.configName = ''
  formData.modelName = ''
  formData.temperature = 0.7
  dialogVisible.value = true
}

const handleEditConfig = (item: AiModelConfig) => {
  dialogTitle.value = '编辑模型配置'
  formData.configId = item.configId
  formData.configName = item.configName
  formData.modelName = item.modelName
  formData.temperature = item.temperature
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      await saveAiModelConfig(formData)
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadConfigs()
    } catch (error) {
      console.error('保存失败:', error)
    }
  })
}

const handleActivate = async (item: AiModelConfig) => {
  await ElMessageBox.confirm(`确定切换为 "${item.configName}" 模型？`, '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
  activatingId.value = item.configId
  try {
    await activateAiModelConfig(item.configId)
    ElMessage.success('已激活')
    loadConfigs()
  } catch (error) {
    console.error('激活失败:', error)
  } finally {
    activatingId.value = null
  }
}

onMounted(() => {
  loadConfigs()
})
</script>

<style scoped>
.container {
  padding: 20px;
}

.box-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-card {
  margin-bottom: 16px;
  transition: border-color 0.2s;
}

.model-card.active {
  border-color: #67c23a;
}

.model-info {
  margin-bottom: 12px;
}

.model-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}

.model-detail {
  color: #606266;
  margin-bottom: 4px;
}

.model-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
