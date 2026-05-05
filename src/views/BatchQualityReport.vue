<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>批次质量分析报告</span>
        </div>
      </template>

      <div class="search-form">
        <el-input
          v-model="searchForm.batchNo"
          placeholder="请输入批次号（如 B202605010001）"
          clearable
          class="search-input"
        />
        <el-button type="primary" :loading="loading" @click="handleGenerate">生成报告</el-button>
        <el-button :disabled="!searchForm.batchNo" @click="handleClearCache">清除缓存</el-button>
      </div>

      <el-empty v-if="!report" description="输入批次号后生成质量报告" />

      <div v-else class="report-wrapper">
        <el-alert
          type="info"
          show-icon
          :closable="false"
          class="report-meta"
          :title="`报告生成时间：${report.generatedAt || '-'}，缓存TTL：${report.cacheTtlSeconds ?? 1800}秒`"
        />

        <el-card shadow="never" class="section-card">
          <template #header>
            <span>批次基本信息</span>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="批次号">{{ basicInfo.batchNo || searchForm.batchNo }}</el-descriptions-item>
            <el-descriptions-item label="工单号">{{ basicInfo.woNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="产品">{{ basicInfo.productName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="产量">{{ formatNumber(basicInfo.actualQty) }}</el-descriptions-item>
            <el-descriptions-item label="良品">{{ formatNumber(basicInfo.goodQty) }}</el-descriptions-item>
            <el-descriptions-item label="不良品">{{ formatNumber(basicInfo.badQty) }}</el-descriptions-item>
            <el-descriptions-item label="良率">
              {{ formatPercent(basicInfo.yieldRate) }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag>{{ basicInfo.batchStatusLabel || basicInfo.batchStatus || '-' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="时间区间">
              {{ basicInfo.startTime || '-' }} ~ {{ basicInfo.endTime || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never" class="section-card">
          <template #header>
            <span>8个工位统计明细</span>
          </template>
          <el-table :data="stationStats" stripe border style="width: 100%">
            <el-table-column prop="stationNo" label="工位" width="80" />
            <el-table-column prop="stationName" label="工位名称" min-width="120" />
            <el-table-column prop="deviceCode" label="设备编码" min-width="140" />
            <el-table-column prop="processType" label="工序" min-width="110" />
            <el-table-column label="参数" min-width="140">
              <template #default="{ row }">{{ row.parameterName || '-' }} {{ row.unit || '' }}</template>
            </el-table-column>
            <el-table-column label="目标值" width="100">
              <template #default="{ row }">{{ formatNumber(row.targetValue) }}</template>
            </el-table-column>
            <el-table-column label="下限" width="100">
              <template #default="{ row }">{{ formatNumber(row.minThreshold) }}</template>
            </el-table-column>
            <el-table-column label="上限" width="100">
              <template #default="{ row }">{{ formatNumber(row.maxThreshold) }}</template>
            </el-table-column>
            <el-table-column prop="sampleCount" label="样本量" width="90" />
            <el-table-column label="均值" width="100">
              <template #default="{ row }">{{ formatNumber(row.mean) }}</template>
            </el-table-column>
            <el-table-column label="标准差" width="100">
              <template #default="{ row }">{{ formatNumber(row.stdDev) }}</template>
            </el-table-column>
            <el-table-column label="最小值" width="100">
              <template #default="{ row }">{{ formatNumber(row.min) }}</template>
            </el-table-column>
            <el-table-column label="最大值" width="100">
              <template #default="{ row }">{{ formatNumber(row.max) }}</template>
            </el-table-column>
            <el-table-column label="超标率" width="100">
              <template #default="{ row }">{{ formatPercent(row.outOfSpecRate) }}</template>
            </el-table-column>
            <el-table-column label="CPK" width="100">
              <template #default="{ row }">{{ formatNumber(row.cpk) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="110" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openTimeSeries(row)">
                  时序数据
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-row :gutter="12" class="section-row">
          <el-col :xs="24" :lg="12">
            <el-card shadow="never" class="section-card compact">
              <template #header>
                <span>告警次数分布</span>
              </template>
              <el-table :data="alarmDistribution" stripe border style="width: 100%">
                <el-table-column prop="alarmType" label="告警类型" min-width="140" />
                <el-table-column prop="alarmLevel" label="告警等级" min-width="120" />
                <el-table-column prop="alarmCount" label="次数" width="90" />
              </el-table>
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="12">
            <el-card shadow="never" class="section-card compact">
              <template #header>
                <span>AI质量评级</span>
              </template>
              <div class="ai-panel">
                <div class="ai-score-row">
                  <el-tag :type="gradeTagType(aiAssessment.grade)" size="large">
                    评级 {{ aiAssessment.grade || '-' }}
                  </el-tag>
                  <div class="ai-score-text">综合评分 {{ formatNumber(aiAssessment.score) }}/100</div>
                </div>
                <el-progress
                  :percentage="normalizeScore(aiAssessment.score)"
                  :status="progressStatus(aiAssessment.grade)"
                />
                <el-divider />
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="质量摘要">
                    {{ aiAssessment.summary || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="异常归因">
                    {{ aiAssessment.rootCause || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="改善建议">
                    <ul class="suggestion-list">
                      <li v-for="(item, index) in aiAssessment.suggestions" :key="`${item}-${index}`">
                        {{ item }}
                      </li>
                      <li v-if="!aiAssessment.suggestions?.length">-</li>
                    </ul>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-drawer
      v-model="timeSeriesVisible"
      title="原始时序数据"
      size="52%"
      :destroy-on-close="true"
    >
      <div class="drawer-top">
        <div>批次：{{ searchForm.batchNo }}</div>
        <div>设备：{{ currentDevice }}</div>
      </div>

      <el-table :data="timeSeriesList" stripe border v-loading="timeSeriesLoading" style="width: 100%">
        <el-table-column prop="ts" label="时间戳" min-width="170">
          <template #default="{ row }">{{ formatTimestamp(row.ts) }}</template>
        </el-table-column>
        <el-table-column prop="value" label="value" min-width="120" />
        <el-table-column prop="processType" label="工艺参数" min-width="120" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import {
  clearBatchQualityCache,
  getBatchQualityReport,
  getBatchQualityTimeSeries,
  type BatchAiAssessment,
  type BatchAlarmDistribution,
  type BatchQualityBasicInfo,
  type BatchQualityReport,
  type BatchQualityReportRaw,
  type BatchStationStat,
  type BatchTimeSeriesPoint,
} from '@/api/batchQuality'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, reactive, ref } from 'vue'

const loading = ref(false)
const report = ref<BatchQualityReport | null>(null)

const timeSeriesVisible = ref(false)
const timeSeriesLoading = ref(false)
const currentDevice = ref('')
const timeSeriesList = ref<BatchTimeSeriesPoint[]>([])

const searchForm = reactive({
  batchNo: '',
})

const basicInfo = computed<BatchQualityBasicInfo>(() => {
  const source = (report.value?.basicInfo || {}) as BatchQualityBasicInfo
  return {
    batchNo: source.batchNo || searchForm.batchNo,
    woNo: source.woNo,
    productName: source.productName,
    actualQty: source.actualQty,
    goodQty: source.goodQty,
    badQty: source.badQty,
    yieldRate: source.yieldRate,
    batchStatus: source.batchStatus,
    batchStatusLabel: source.batchStatusLabel,
    startTime: source.startTime,
    endTime: source.endTime,
  }
})

const stationStats = computed<BatchStationStat[]>(() => {
  return (report.value?.stationStats || []).map((item, index) => ({
    ...item,
    stationNo: item.stationNo ?? index + 1,
  }))
})

const alarmDistribution = computed<BatchAlarmDistribution[]>(() => {
  return report.value?.alarmDistribution || []
})

const aiAssessment = computed<BatchAiAssessment>(() => {
  return {
    grade: report.value?.aiAssessment?.grade,
    score: report.value?.aiAssessment?.score,
    summary: report.value?.aiAssessment?.summary,
    rootCause: report.value?.aiAssessment?.rootCause,
    suggestions: report.value?.aiAssessment?.suggestions || [],
  }
})

const normalizeScore = (score?: number) => {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0
  if (score < 0) return 0
  if (score > 100) return 100
  return Number(score.toFixed(2))
}

const gradeTagType = (grade?: string) => {
  if (grade === 'A') return 'success'
  if (grade === 'B') return 'primary'
  if (grade === 'C') return 'warning'
  return 'danger'
}

const progressStatus = (grade?: string) => {
  if (grade === 'A' || grade === 'B') return 'success'
  if (grade === 'C') return 'warning'
  return 'exception'
}

const formatNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (Number.isNaN(num)) return '-'
  return Number.isInteger(num) ? `${num}` : num.toFixed(4)
}

const formatPercent = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (Number.isNaN(num)) return '-'

  if (num <= 1) {
    return `${(num * 100).toFixed(2)}%`
  }

  return `${num.toFixed(2)}%`
}

const formatTimestamp = (ts: unknown) => {
  const num = Number(ts)
  if (Number.isNaN(num)) return '-'
  const date = new Date(num)
  if (Number.isNaN(date.getTime())) return '-'

  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  const hh = `${date.getHours()}`.padStart(2, '0')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  const ss = `${date.getSeconds()}`.padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return undefined
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}

const sanitizeStationStats = (source: unknown): BatchStationStat[] => {
  if (!Array.isArray(source)) return []

  return source.map((raw, index) => {
    const row = raw as Record<string, unknown>
    return {
      stationNo: toNumber(row.stationNo) ?? index + 1,
      stationName: (row.stationName as string) || undefined,
      deviceCode: String(row.deviceCode || ''),
      processType: (row.processType as string) || undefined,
      parameterName: (row.parameterName as string) || undefined,
      unit: (row.unit as string) || undefined,
      targetValue: toNumber(row.targetValue),
      minThreshold: toNumber(row.minThreshold),
      maxThreshold: toNumber(row.maxThreshold),
      sampleCount: toNumber(row.sampleCount),
      mean: toNumber(row.mean),
      stdDev: toNumber(row.stdDev),
      min: toNumber(row.min ?? row.minVal),
      max: toNumber(row.max ?? row.maxVal),
      minVal: toNumber(row.minVal ?? row.min),
      maxVal: toNumber(row.maxVal ?? row.max),
      outOfRangeCount: toNumber(row.outOfRangeCount),
      outOfSpecRate: toNumber(row.outOfSpecRate ?? row.outOfRangeRate),
      outOfRangeRate: toNumber(row.outOfRangeRate ?? row.outOfSpecRate),
      cpk: toNumber(row.cpk),
    }
  })
}

const sanitizeReport = (raw: BatchQualityReportRaw | BatchQualityReport): BatchQualityReport => {
  const reportRaw = raw as BatchQualityReportRaw
  const normalizedFromFlat = Boolean(reportRaw.batchNo || reportRaw.stationStatsList)

  if (normalizedFromFlat) {
    const suggestion = reportRaw.aiImprovementSuggestion
    return {
      basicInfo: {
        batchNo: reportRaw.batchNo || searchForm.batchNo,
        actualQty: reportRaw.actualQty,
        goodQty:
          typeof reportRaw.actualQty === 'number' && typeof reportRaw.badQty === 'number'
            ? reportRaw.actualQty - reportRaw.badQty
            : undefined,
        badQty: reportRaw.badQty,
        yieldRate: reportRaw.yieldRate,
        batchStatus: reportRaw.batchStatus,
        batchStatusLabel:
          typeof reportRaw.batchStatus === 'string' ? reportRaw.batchStatus : undefined,
        startTime: reportRaw.startTime,
        endTime: reportRaw.endTime,
      },
      stationStats: sanitizeStationStats(reportRaw.stationStatsList),
      alarmDistribution: Array.isArray(reportRaw.alarmDistribution) ? reportRaw.alarmDistribution : [],
      aiAssessment: {
        grade: reportRaw.qualityGrade,
        score: reportRaw.qualityScore,
        summary: reportRaw.aiReportSummary,
        rootCause: reportRaw.aiRootCauseAnalysis,
        suggestions: suggestion ? [suggestion] : [],
      },
      generatedAt: reportRaw.reportTime,
      cacheTtlSeconds: 1800,
    }
  }

  const old = raw as BatchQualityReport
  const basic = (old.basicInfo || {}) as BatchQualityBasicInfo
  const aiRaw = (old.aiAssessment || {}) as BatchAiAssessment
  const normalizedSuggestions = Array.isArray(aiRaw.suggestions) ? aiRaw.suggestions : []

  return {
    ...old,
    basicInfo: {
      batchNo: basic.batchNo || searchForm.batchNo,
      woNo: basic.woNo,
      productName: basic.productName,
      actualQty: basic.actualQty,
      goodQty: basic.goodQty,
      badQty: basic.badQty,
      yieldRate: basic.yieldRate,
      batchStatus: basic.batchStatus,
      batchStatusLabel: basic.batchStatusLabel,
      startTime: basic.startTime,
      endTime: basic.endTime,
    },
    stationStats: sanitizeStationStats(old.stationStats),
    alarmDistribution: Array.isArray(old.alarmDistribution) ? old.alarmDistribution : [],
    aiAssessment: {
      grade: aiRaw.grade,
      score: aiRaw.score,
      summary: aiRaw.summary,
      rootCause: aiRaw.rootCause,
      suggestions: normalizedSuggestions,
    },
    cacheTtlSeconds: old.cacheTtlSeconds,
    generatedAt: old.generatedAt,
  }
}

const handleGenerate = async () => {
  if (!searchForm.batchNo.trim()) {
    ElMessage.warning('请先输入批次号')
    return
  }

  loading.value = true
  try {
    const res = await getBatchQualityReport(searchForm.batchNo.trim())
    report.value = sanitizeReport(res.data || {})
    ElMessage.success('质量报告生成成功')
  } finally {
    loading.value = false
  }
}

const handleClearCache = async () => {
  if (!searchForm.batchNo.trim()) {
    ElMessage.warning('请先输入批次号')
    return
  }

  await ElMessageBox.confirm(`确认清除批次 ${searchForm.batchNo} 的缓存？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })

  await clearBatchQualityCache(searchForm.batchNo.trim())
  ElMessage.success('缓存已清除')
}

const openTimeSeries = async (row: BatchStationStat) => {
  if (!searchForm.batchNo.trim()) {
    ElMessage.warning('请先输入批次号')
    return
  }
  if (!row.deviceCode) {
    ElMessage.warning('当前工位缺少设备编码，无法查询时序数据')
    return
  }

  currentDevice.value = row.deviceCode
  timeSeriesVisible.value = true
  timeSeriesLoading.value = true
  try {
    const res = await getBatchQualityTimeSeries(searchForm.batchNo.trim(), row.deviceCode)
    timeSeriesList.value = Array.isArray(res.data) ? res.data : []
  } finally {
    timeSeriesLoading.value = false
  }
}
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
  width: 320px;
}

.report-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-meta {
  margin-bottom: 4px;
}

.section-card {
  margin-bottom: 0;
}

.section-card.compact {
  height: 100%;
}

.section-row {
  margin-top: 0;
}

.ai-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.ai-score-text {
  font-weight: 600;
}

.suggestion-list {
  margin: 0;
  padding-left: 18px;
}

.drawer-top {
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .search-input {
    width: 100%;
  }

  .ai-score-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
