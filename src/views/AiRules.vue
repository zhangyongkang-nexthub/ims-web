<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>规则引擎配置</span>
          <el-button type="primary" @click="openDialog('add')">新增规则</el-button>
        </div>
      </template>

      <el-table :data="tableData" stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="ruleId" label="ID" width="70" />
        <el-table-column prop="ruleName" label="规则名称" width="180" />
        <el-table-column prop="metricName" label="监控指标" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.metricName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作符" width="80" />
        <el-table-column prop="thresholdValue" label="阈值" width="100" />
        <el-table-column prop="severity" label="严重程度" width="120">
          <template #default="{ row }">
            <el-tag :type="severityTag(row.severity)">{{ row.severity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="触发动作" min-width="200" show-overflow-tooltip />
        <el-table-column prop="skipLlm" label="跳过AI" width="90">
          <template #default="{ row }">
            <el-tag :type="row.skipLlm === 1 ? 'warning' : 'success'">
              {{ row.skipLlm === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" />
        <el-table-column prop="isActive" label="启用" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive === 1 ? 'success' : 'info'">
              {{ row.isActive === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="formData.ruleName" placeholder="如：灌装标准差超限" />
        </el-form-item>
        <el-form-item label="监控指标" prop="metricName">
          <el-select v-model="formData.metricName" placeholder="选择指标">
            <el-option label="fill_std" value="fill_std" />
            <el-option label="speed" value="speed" />
            <el-option label="temp" value="temp" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作符" prop="operator">
          <el-select v-model="formData.operator" placeholder="选择操作符">
            <el-option label=">" value=">" />
            <el-option label="<" value="<" />
            <el-option label=">=" value=">=" />
            <el-option label="<=" value="<=" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值" prop="thresholdValue">
          <el-input-number v-model="formData.thresholdValue" :precision="4" :step="0.01" />
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-select v-model="formData.severity" placeholder="选择严重程度">
            <el-option label="WARNING（警告）" value="WARNING" />
            <el-option label="CRITICAL（严重）" value="CRITICAL" />
            <el-option label="EMERGENCY（紧急）" value="EMERGENCY" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发动作" prop="action">
          <el-input
            v-model="formData.action"
            type="textarea"
            :rows="2"
            placeholder="如：立即停机，通知维修人员"
          />
        </el-form-item>
        <el-form-item label="跳过AI" prop="skipLlm">
          <el-switch
            v-model="formData.skipLlm"
            :active-value="1"
            :inactive-value="0"
            active-text="仅规则"
            inactive-text="仍调AI"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="formData.priority" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="启用" prop="isActive">
          <el-switch
            v-model="formData.isActive"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="停用"
          />
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
  createAiRule,
  deleteAiRule,
  getAiRules,
  updateAiRule,
  type AiRuleForm,
  type AiRuleItem,
} from '@/api/ai'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const dialogTitle = ref('新增规则')
const formRef = ref<FormInstance>()
const tableData = ref<AiRuleItem[]>([])
const editingRuleId = ref<number>(0)

const formData = reactive<AiRuleForm>({
  ruleName: '',
  metricName: 'fill_std',
  operator: '>',
  thresholdValue: 0,
  severity: 'WARNING',
  action: '',
  skipLlm: 0,
  priority: 10,
  isActive: 1,
})

const rules = {
  ruleName: [{ required: true, message: '规则名称不能为空', trigger: 'blur' }],
  metricName: [{ required: true, message: '监控指标不能为空', trigger: 'change' }],
  operator: [{ required: true, message: '操作符不能为空', trigger: 'change' }],
  thresholdValue: [{ required: true, message: '阈值不能为空', trigger: 'blur' }],
  severity: [{ required: true, message: '严重程度不能为空', trigger: 'change' }],
  action: [{ required: true, message: '触发动作不能为空', trigger: 'blur' }],
}

const severityTag = (val: string) => {
  if (val === 'EMERGENCY') return 'danger'
  if (val === 'CRITICAL') return 'warning'
  return 'info'
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getAiRules()
    tableData.value = res.data
  } finally {
    loading.value = false
  }
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增规则' : '编辑规则'
  if (type === 'add') {
    editingRuleId.value = 0
    formData.ruleName = ''
    formData.metricName = 'fill_std'
    formData.operator = '>'
    formData.thresholdValue = 0
    formData.severity = 'WARNING'
    formData.action = ''
    formData.skipLlm = 0
    formData.priority = 10
    formData.isActive = 1
  }
  dialogVisible.value = true
}

const handleEdit = (row: AiRuleItem) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑规则'
  editingRuleId.value = row.ruleId
  formData.ruleName = row.ruleName
  formData.metricName = row.metricName
  formData.operator = row.operator
  formData.thresholdValue = row.thresholdValue
  formData.severity = row.severity
  formData.action = row.action
  formData.skipLlm = row.skipLlm
  formData.priority = row.priority
  formData.isActive = row.isActive
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      if (dialogType.value === 'add') {
        await createAiRule(formData)
        ElMessage.success('新增成功')
      } else {
        await updateAiRule(editingRuleId.value, formData)
        ElMessage.success('修改成功')
      }
      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleDelete = (row: AiRuleItem) => {
  ElMessageBox.confirm(`确定删除规则 "${row.ruleName}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteAiRule(row.ruleId)
      ElMessage.success('删除成功')
      getList()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

onMounted(() => {
  getList()
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
</style>
