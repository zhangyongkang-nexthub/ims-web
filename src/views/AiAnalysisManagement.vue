<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>AI辅助决策</span>
          <el-tag type="success" v-if="latestPushTime">最近推送：{{ latestPushTime }}</el-tag>
          <el-tag type="info" v-else>等待AI推送</el-tag>
        </div>
      </template>

      <el-row :gutter="16" class="panel-row">
        <el-col :xs="24" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <span>手动触发分析</span>
            </template>
            <el-form ref="analyzeFormRef" :model="analyzeForm" :rules="analyzeRules" label-width="110px">
              <el-form-item label="设备编码" prop="deviceCode">
                <el-input v-model="analyzeForm.deviceCode" placeholder="如：DEV00001" />
              </el-form-item>
              <el-form-item label="生产批次" prop="batchNo">
                <el-input v-model="analyzeForm.batchNo" placeholder="如：B20260413001" />
              </el-form-item>
              <el-form-item label="工序类型" prop="processType">
                <el-input v-model="analyzeForm.processType" placeholder="如：FILLING" />
              </el-form-item>
              <el-form-item label="均值" prop="mean">
                <el-input-number v-model="analyzeForm.mean" :precision="4" :step="0.01" class="full-width" />
              </el-form-item>
              <el-form-item label="方差" prop="variance">
                <el-input-number v-model="analyzeForm.variance" :precision="6" :step="0.0001" class="full-width" />
              </el-form-item>
              <el-form-item label="最大值" prop="maxVal">
                <el-input-number v-model="analyzeForm.maxVal" :precision="4" :step="0.01" class="full-width" />
              </el-form-item>
              <el-form-item label="最小值" prop="minVal">
                <el-input-number v-model="analyzeForm.minVal" :precision="4" :step="0.01" class="full-width" />
              </el-form-item>
              <el-form-item label="采样数" prop="sampleCount">
                <el-input-number v-model="analyzeForm.sampleCount" :min="1" :step="1" class="full-width" />
              </el-form-item>
              <el-form-item label="窗口时间" prop="windowRange">
                <el-date-picker
                  v-model="analyzeForm.windowRange"
                  type="datetimerange"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  value-format="x"
                  class="full-width"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="analyzeLoading" @click="handleAnalyze">触发分析</el-button>
                <el-button @click="resetAnalyzeForm">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="latest-header">
                <span>设备最近分析</span>
                <div class="latest-actions">
                  <el-input v-model="latestDeviceCode" placeholder="输入设备编码" class="latest-input" />
                  <el-button type="primary" :loading="latestLoading" @click="loadLatest">查询</el-button>
                </div>
              </div>
            </template>
            <el-empty v-if="!latestResult" description="暂无结果" />
            <div v-else class="result-panel">
              <div class="result-line"><strong>设备：</strong>{{ latestResult.deviceCode }}</div>
              <div class="result-line"><strong>批次：</strong>{{ latestResult.batchNo }}</div>
              <div class="result-line"><strong>工序：</strong>{{ latestResult.processType }}</div>
              <div class="result-line"><strong>风险评分：</strong>{{ latestResult.riskScore }}</div>
              <div class="result-line"><strong>风险等级：</strong>{{ latestResult.riskLevel }}</div>
              <div class="result-line"><strong>原因：</strong>{{ latestResult.reason }}</div>
              <div class="result-line"><strong>建议：</strong>{{ latestResult.suggestion }}</div>
              <div class="result-line"><strong>最终决策：</strong>{{ latestResult.finalDecision }}</div>
              <div class="result-line"><strong>统计快照：</strong>{{ latestResult.statsSnapshot }}</div>
              <div class="result-line"><strong>分析时间：</strong>{{ latestResult.analysisTime }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="inner-card history-card">
        <template #header>
          <span>分析历史</span>
        </template>

        <div class="search-form">
          <el-input v-model="searchForm.deviceCode" placeholder="设备编码" clearable class="search-input" />
          <el-select v-model="searchForm.riskLevel" placeholder="风险等级" clearable class="search-select">
            <el-option label="高风险" value="高风险" />
            <el-option label="中风险" value="中风险" />
            <el-option label="低风险" value="低风险" />
          </el-select>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>

        <el-table :data="tableData" stripe style="width: 100%" v-loading="tableLoading">
          <el-table-column prop="deviceCode" label="设备编码" width="120" />
          <el-table-column prop="batchNo" label="生产批次" width="140" />
          <el-table-column prop="processType" label="工序类型" width="120" />
          <el-table-column prop="riskScore" label="风险评分" width="100" />
          <el-table-column prop="riskLevel" label="风险等级" width="120" />
          <el-table-column prop="finalDecision" label="最终决策" min-width="220" show-overflow-tooltip />
          <el-table-column prop="reason" label="原因分析" min-width="220" show-overflow-tooltip />
          <el-table-column prop="suggestion" label="操作建议" min-width="220" show-overflow-tooltip />
          <el-table-column prop="analysisTime" label="分析时间" width="180" />
        </el-table>

        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @change="getHistoryList"
          class="pagination"
        />
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {
  getAiHistory,
  getAiLatest,
  triggerAiAnalyze,
  type AiAnalysisResult,
  type AiAnalyzeRequest,
} from '@/api/ai'
import { onAiAnalysisPush } from '@/utils/alarmWs'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'

const analyzeFormRef = ref<FormInstance>()
const analyzeLoading = ref(false)
const latestLoading = ref(false)
const tableLoading = ref(false)
const latestResult = ref<AiAnalysisResult | null>(null)
const latestPushTime = ref('')
const latestDeviceCode = ref('DEV00001')
const tableData = ref<AiAnalysisResult[]>([])
let stopAiListener: (() => void) | null = null

const analyzeForm = reactive<{
  batchNo: string
  deviceCode: string
  processType: string
  mean: number
  variance: number
  maxVal: number
  minVal: number
  sampleCount: number
  windowRange: [string, string] | []
}>({
  batchNo: 'B20260413001',
  deviceCode: 'DEV00001',
  processType: 'FILLING',
  mean: 11.52,
  variance: 0.0034,
  maxVal: 11.68,
  minVal: 11.35,
  sampleCount: 120,
  windowRange: [],
})

const analyzeRules = {
  batchNo: [{ required: true, message: '请输入生产批次', trigger: 'blur' }],
  deviceCode: [{ required: true, message: '请输入设备编码', trigger: 'blur' }],
  processType: [{ required: true, message: '请输入工序类型', trigger: 'blur' }],
  mean: [{ required: true, message: '请输入均值', trigger: 'blur' }],
  variance: [{ required: true, message: '请输入方差', trigger: 'blur' }],
  maxVal: [{ required: true, message: '请输入最大值', trigger: 'blur' }],
  minVal: [{ required: true, message: '请输入最小值', trigger: 'blur' }],
  sampleCount: [{ required: true, message: '请输入采样数', trigger: 'blur' }],
  windowRange: [{ required: true, message: '请选择窗口时间', trigger: 'change' }],
}

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  deviceCode: '',
  riskLevel: '',
})

const buildAnalyzeRequest = (): AiAnalyzeRequest => {
  const [start, end] = analyzeForm.windowRange
  return {
    batchNo: analyzeForm.batchNo,
    deviceCode: analyzeForm.deviceCode,
    processType: analyzeForm.processType,
    mean: analyzeForm.mean,
    variance: analyzeForm.variance,
    maxVal: analyzeForm.maxVal,
    minVal: analyzeForm.minVal,
    sampleCount: analyzeForm.sampleCount,
    windowStartTime: Number(start),
    windowEndTime: Number(end),
  }
}

const setDefaultWindowRange = () => {
  if (analyzeForm.windowRange.length) return
  const end = Date.now()
  const start = end - 60 * 1000
  analyzeForm.windowRange = [String(start), String(end)]
}

const handleAnalyze = async () => {
  if (!analyzeFormRef.value) return
  const valid = await analyzeFormRef.value.validate().catch(() => false)
  if (!valid) return

  analyzeLoading.value = true
  try {
    const res = await triggerAiAnalyze(buildAnalyzeRequest())
    latestResult.value = res.data
    ElMessage.success('AI分析触发成功')
    getHistoryList()
  } finally {
    analyzeLoading.value = false
  }
}

const resetAnalyzeForm = () => {
  analyzeForm.batchNo = ''
  analyzeForm.deviceCode = ''
  analyzeForm.processType = ''
  analyzeForm.mean = 0
  analyzeForm.variance = 0
  analyzeForm.maxVal = 0
  analyzeForm.minVal = 0
  analyzeForm.sampleCount = 1
  analyzeForm.windowRange = []
}

const loadLatest = async () => {
  if (!latestDeviceCode.value) {
    ElMessage.warning('请输入设备编码')
    return
  }

  latestLoading.value = true
  try {
    const res = await getAiLatest(latestDeviceCode.value)
    latestResult.value = res.data
  } finally {
    latestLoading.value = false
  }
}

const getHistoryList = async () => {
  tableLoading.value = true
  try {
    const res = await getAiHistory({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      deviceCode: searchForm.deviceCode || undefined,
      riskLevel: searchForm.riskLevel || undefined,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } finally {
    tableLoading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  getHistoryList()
}

const handleReset = () => {
  searchForm.deviceCode = ''
  searchForm.riskLevel = ''
  pagination.pageNum = 1
  getHistoryList()
}

onMounted(async () => {
  setDefaultWindowRange()
  await getHistoryList()
  stopAiListener = onAiAnalysisPush((data) => {
    latestPushTime.value = data.analysisTime
    latestResult.value = data
    tableData.value = [data, ...tableData.value].slice(0, pagination.pageSize)
  })
})

onBeforeUnmount(() => {
  if (stopAiListener) {
    stopAiListener()
    stopAiListener = null
  }
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

.panel-row {
  margin-bottom: 16px;
}

.inner-card {
  height: 100%;
}

.latest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.latest-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.latest-input {
  width: 180px;
}

.result-panel {
  display: grid;
  gap: 8px;
}

.result-line {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

.history-card {
  margin-top: 16px;
}

.search-form {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input,
.search-select {
  width: 220px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.full-width {
  width: 100%;
}
</style>
