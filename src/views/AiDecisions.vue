<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>决策日志</span>
        </div>
      </template>

      <div class="search-form">
        <el-input
          v-model="searchForm.deviceCode"
          placeholder="设备编码"
          clearable
          class="search-input"
        />
        <el-select
          v-model="searchForm.decisionType"
          placeholder="决策类型"
          clearable
          class="search-select"
        >
          <el-option label="规则(RULE)" value="RULE" />
          <el-option label="AI分析(AI)" value="AI" />
          <el-option label="降级(FALLBACK)" value="FALLBACK" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="tableData" stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="decisionId" label="ID" width="80" />
        <el-table-column prop="refDeviceCode" label="设备编码" width="140" />
        <el-table-column prop="decisionType" label="决策类型" width="120">
          <template #default="{ row }">
            <el-tag :type="decisionTypeTag(row.decisionType)">{{ row.decisionType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="riskLevel" label="风险等级" width="120">
          <template #default="{ row }">
            <el-tag :type="riskLevelTag(row.riskLevel)">{{ row.riskLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="suggestionContent"
          label="建议内容"
          min-width="300"
          show-overflow-tooltip
        />
        <el-table-column prop="isAdopted" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="adoptedTag(row.isAdopted)">{{ adoptedLabel(row.isAdopted) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.isAdopted === 0"
              link
              type="success"
              size="small"
              @click="handleFeedback(row, 1)"
            >
              ✅ 采纳
            </el-button>
            <el-button
              v-if="row.isAdopted === 0"
              link
              type="warning"
              size="small"
              @click="handleFeedback(row, 2)"
            >
              ❌ 忽略
            </el-button>
            <el-tag v-if="row.isAdopted === 1" type="success">已采纳</el-tag>
            <el-tag v-if="row.isAdopted === 2" type="warning">已忽略</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @change="getList"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {
  getAiDecisions,
  submitAiDecisionFeedback,
  type AiDecisionRecord,
  type DecisionType,
} from '@/api/ai'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const userStore = useUserStore()
const loading = ref(false)
const tableData = ref<AiDecisionRecord[]>([])

const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const searchForm = reactive<{ deviceCode: string; decisionType?: DecisionType }>({
  deviceCode: '',
  decisionType: undefined,
})

const decisionTypeTag = (type: string) => {
  if (type === 'RULE') return 'warning'
  if (type === 'AI') return 'success'
  return 'info'
}

const riskLevelTag = (level: string) => {
  if (level?.includes('高')) return 'danger'
  if (level?.includes('中')) return 'warning'
  return 'success'
}

const adoptedTag = (val: number) => {
  if (val === 1) return 'success'
  if (val === 2) return 'warning'
  return 'info'
}

const adoptedLabel = (val: number) => {
  if (val === 1) return '已采纳'
  if (val === 2) return '已忽略'
  return '未处理'
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getAiDecisions({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      deviceCode: searchForm.deviceCode || undefined,
      decisionType: searchForm.decisionType || undefined,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}

const handleReset = () => {
  searchForm.deviceCode = ''
  searchForm.decisionType = undefined
  pagination.pageNum = 1
  getList()
}

const handleFeedback = async (row: AiDecisionRecord, isAdopted: 1 | 2) => {
  const actionText = isAdopted === 1 ? '采纳' : '忽略'
  await ElMessageBox.confirm(`确定${actionText}该决策建议？`, '确认操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  try {
    const handleUser = userStore.userInfo?.username || '管理员'
    await submitAiDecisionFeedback(row.decisionId, { isAdopted, handleUser })
    ElMessage.success(`已${actionText}`)
    getList()
  } catch (error) {
    console.error('反馈失败:', error)
  }
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

.search-form {
  margin-bottom: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  width: 200px;
}

.search-select {
  width: 160px;
}

.pagination {
  margin-top: 12px;
  justify-content: flex-end;
}
</style>
