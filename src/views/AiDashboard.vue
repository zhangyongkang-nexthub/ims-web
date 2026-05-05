<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <div class="title-wrap">
            <span>AI 实时监控大屏</span>
            <el-tag :type="wsConnected ? 'success' : 'danger'" effect="dark">
              {{ wsConnected ? 'WebSocket 已连接' : 'WebSocket 已断开' }}
            </el-tag>
          </div>
          <div class="header-right">
            <el-text type="info">设备数：{{ cardList.length }}</el-text>
            <el-text type="info">报警数：{{ alarmCount }}</el-text>
            <el-button :loading="loading" @click="refreshAll">刷新</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="16" class="summary-row">
        <el-col :xs="12" :md="8" :xl="4">
          <el-statistic title="高风险设备" :value="highRiskCount" />
        </el-col>
        <el-col :xs="12" :md="8" :xl="4">
          <el-statistic title="中风险设备" :value="midRiskCount" />
        </el-col>
        <el-col :xs="12" :md="8" :xl="4">
          <el-statistic title="低风险设备" :value="lowRiskCount" />
        </el-col>
        <el-col :xs="12" :md="8" :xl="4">
          <el-statistic title="未处理报警" :value="alarmCount" />
        </el-col>
        <el-col :xs="12" :md="8" :xl="4">
          <el-statistic title="总产量" :value="productionStats.totalOutput" />
        </el-col>
        <el-col :xs="12" :md="8" :xl="4">
          <el-statistic title="良品率" :value="productionStats.qualificationRate" suffix="%" />
        </el-col>
      </el-row>

      <div class="stats-time">生产统计更新：{{ productionStats.lastUpdated || '-' }}</div>

      <el-empty v-if="!cardList.length && !loading" description="暂无设备分析数据" />

      <el-row :gutter="16">
        <el-col v-for="item in cardList" :key="item.deviceCode" :xs="24" :sm="12" :xl="8">
          <el-card class="device-card" :class="riskCardClass(item)" shadow="hover">
            <template #header>
              <div class="device-head">
                <div>
                  <div class="device-code">{{ item.deviceCode }}</div>
                  <div class="device-process">{{ getProcessLabel(item.processType) }}</div>
                </div>
                <el-tag :type="riskTagType(item.displayRiskScore, item.displayRiskLevel)">
                  {{ item.displayRiskLevel }}
                </el-tag>
              </div>
            </template>

            <div v-if="item.fastRisk" class="realtime-section">
              <div class="line-item compact-line">
                <span class="line-label">实时值：</span>
                <span class="line-content">
                  {{ formatRealtimeValue(item.fastRisk.currentValue) }} {{ realtimeUnit(item.fastRisk.processType) }}
                </span>
              </div>
              <el-progress
                :percentage="Math.round(clamp01(item.fastRisk.deviation) * 100)"
                :color="riskColor(item.fastRisk.riskFast)"
                :stroke-width="10"
              />
              <div class="quick-metrics">
                <span>快速风险：{{ item.fastRisk.riskFast.toFixed(2) }}</span>
                <span>趋势：{{ slopeArrow(item.fastRisk.slope) }} {{ trendLabel(item.fastRisk.slope) }}</span>
                <span>ETA：{{ formatEta(item.fastRisk.etaSeconds) }}</span>
              </div>
            </div>

            <div v-else class="realtime-empty">暂无秒级预警数据</div>

            <div class="ai-divider">AI 分析层（10s）</div>

            <div class="gauge-wrap" v-if="item.aiAnalysis">
              <el-progress
                type="dashboard"
                :percentage="Math.round(item.aiAnalysis.riskScore * 100)"
                :color="riskColor(item.aiAnalysis.riskScore)"
              >
                <template #default>
                  <span class="risk-number">{{ item.aiAnalysis.riskScore.toFixed(2) }}</span>
                </template>
              </el-progress>
            </div>
            <div v-else class="realtime-empty">暂无 AI 分析数据</div>

            <div class="line-item">
              <span class="line-label">分析原因：</span>
              <span class="line-content" v-html="highlightKb(item.aiAnalysis?.reason || '-')"></span>
            </div>
            <div class="line-item">
              <span class="line-label">操作建议：</span>
              <span class="line-content">{{ item.aiAnalysis?.suggestion || '-' }}</span>
            </div>
            <div class="line-item">
              <span class="line-label">决策来源：</span>
              <el-tag :type="decisionTagType(item.aiAnalysis?.statsSnapshot)">{{
                decisionSource(item.aiAnalysis?.statsSnapshot)
              }}</el-tag>
            </div>
            <div class="line-item">
              <span class="line-label">分析时间：</span>
              <span class="line-content">{{ item.aiAnalysis?.analysisTime || '-' }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>最新报警</span>
          <el-text type="info">实时推送命中报警后自动刷新</el-text>
        </div>
      </template>

      <el-table :data="latestAlarms" stripe v-loading="alarmLoading" style="width: 100%">
        <el-table-column prop="deviceCode" label="设备编码" width="140" />
        <el-table-column prop="processType" label="工序" width="120" />
        <el-table-column prop="alarmLevel" label="报警级别" width="120" />
        <el-table-column prop="alarmMsg" label="报警信息" min-width="260" show-overflow-tooltip />
        <el-table-column prop="createTime" label="报警时间" width="180" />
      </el-table>
    </el-card>

    <el-card class="box-card history-card">
      <template #header>
        <div class="card-header">
          <span>分析历史</span>
        </div>
      </template>

      <div class="search-form">
        <el-input
          v-model="searchForm.deviceCode"
          placeholder="设备编码"
          clearable
          class="search-input"
        />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="historyData" stripe v-loading="historyLoading" style="width: 100%">
        <el-table-column prop="deviceCode" label="设备编码" width="140" />
        <el-table-column prop="batchNo" label="批次号" width="160" />
        <el-table-column prop="processType" label="工序" width="140">
          <template #default="{ row }">
            {{ getProcessLabel(row.processType) }}
          </template>
        </el-table-column>
        <el-table-column prop="riskScore" label="风险评分" width="100" />
        <el-table-column prop="riskLevel" label="风险等级" width="130" />
        <el-table-column prop="reason" label="原因" min-width="260" show-overflow-tooltip />
        <el-table-column prop="suggestion" label="建议" min-width="220" show-overflow-tooltip />
        <el-table-column prop="analysisTime" label="时间" width="180" />
      </el-table>

      <el-pagination
        v-model:current-page="historyPagination.pageNum"
        v-model:page-size="historyPagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="historyPagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @change="loadHistory"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { getAiHistory, getAiLatest, type AiAnalysisResult } from '@/api/ai'
import { getAlarmList, getUnhandledAlarmCount, type AlarmPushData, type AlarmRecord } from '@/api/alarm'
import { getProductionStats } from '@/api/dashboard'
import { getDeviceList } from '@/api/device'
import { useDictData } from '@/composables/useDictData'
import { DICT_TYPE } from '@/constants/dict'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

const WS_URL = import.meta.env.VITE_AI_DASHBOARD_WS_URL || 'ws://localhost:8080/ws/alarm'
const STATS_REFRESH_INTERVAL = 60000

interface FastRiskPayload {
  deviceCode: string
  batchNo: string
  processType: string
  currentValue: number
  riskFast: number
  riskLevel: string
  deviation: number
  slope: number
  volatility: number
  etaSeconds: number
  target: number
  minThreshold: number
  maxThreshold: number
  timestamp: number
}

interface DashboardCardItem {
  deviceCode: string
  processType: string
  batchNo: string
  aiAnalysis?: AiAnalysisResult
  fastRisk?: FastRiskPayload
  displayRiskScore: number
  displayRiskLevel: string
}

const { getLabel: getProcessLabel, load: loadProcessDict } = useDictData(DICT_TYPE.PROCESS_TYPE)

const loading = ref(false)
const historyLoading = ref(false)
const alarmLoading = ref(false)
const wsConnected = ref(false)
const alarmCount = ref(0)
const deviceCodes = ref<string[]>([])
const historyData = ref<AiAnalysisResult[]>([])
const latestAlarms = ref<AlarmRecord[]>([])
const aiCardsMap = ref<Record<string, AiAnalysisResult>>({})
const fastRiskMap = ref<Record<string, FastRiskPayload>>({})
const productionStats = ref({
  totalOutput: 0,
  qualificationRate: 0,
  lastUpdated: '',
})

let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let statsRefreshTimer: number | null = null
let alarmRefreshTimer: number | null = null
const aiLastAppliedAt = new Map<string, number>()
const aiPendingByDevice = new Map<string, AiAnalysisResult>()
const aiThrottleTimerByDevice = new Map<string, number>()

const historyPagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  deviceCode: '',
})

const cardList = computed<DashboardCardItem[]>(() => {
  const deviceOrder = new Map(deviceCodes.value.map((code, index) => [code, index]))
  const codes = new Set<string>([
    ...Object.keys(aiCardsMap.value),
    ...Object.keys(fastRiskMap.value),
    ...deviceCodes.value,
  ])

  return Array.from(codes)
    .map((code) => {
      const aiAnalysis = aiCardsMap.value[code]
      const fastRisk = fastRiskMap.value[code]
      const displayRiskScore = fastRisk?.riskFast ?? Number(aiAnalysis?.riskScore || 0)
      const displayRiskLevel = fastRisk?.riskLevel || aiAnalysis?.riskLevel || 'LOW'

      return {
        deviceCode: code,
        processType: fastRisk?.processType || aiAnalysis?.processType || '',
        batchNo: fastRisk?.batchNo || aiAnalysis?.batchNo || '',
        aiAnalysis,
        fastRisk,
        displayRiskScore,
        displayRiskLevel,
      }
    })
    .filter((item) => item.aiAnalysis || item.fastRisk)
    .sort((a, b) => {
      const aOrder = deviceOrder.get(a.deviceCode)
      const bOrder = deviceOrder.get(b.deviceCode)

      if (aOrder !== undefined && bOrder !== undefined) {
        return aOrder - bOrder
      }
      if (aOrder !== undefined) return -1
      if (bOrder !== undefined) return 1

      return a.deviceCode.localeCompare(b.deviceCode)
    })
})

const highRiskCount = computed(() => cardList.value.filter((item) => item.displayRiskScore >= 0.8).length)
const midRiskCount = computed(
  () => cardList.value.filter((item) => item.displayRiskScore >= 0.6 && item.displayRiskScore < 0.8).length,
)
const lowRiskCount = computed(() => cardList.value.filter((item) => item.displayRiskScore < 0.6).length)

const clamp01 = (num: number) => Math.min(1, Math.max(0, Number(num || 0)))

const riskColor = (score: number) => {
  if (score >= 0.8) return '#F56C6C'
  if (score >= 0.6) return '#E6A23C'
  return '#67C23A'
}

const riskTagType = (score: number, level?: string) => {
  const normalizedLevel = String(level || '').toUpperCase()
  if (normalizedLevel === 'HIGH') return 'danger'
  if (normalizedLevel === 'MEDIUM') return 'warning'
  if (normalizedLevel === 'LOW') return 'success'

  if (score >= 0.8) return 'danger'
  if (score >= 0.6) return 'warning'
  return 'success'
}

const slopeArrow = (slope: number) => {
  if (slope > 0.01) return '↑'
  if (slope < -0.01) return '↓'
  return '→'
}

const trendLabel = (slope: number) => {
  if (slope > 0.01) return '上升'
  if (slope < -0.01) return '下降'
  return '稳定'
}

const formatSlope = (slope: number) => {
  const value = Number(slope || 0)
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`
}

const formatEta = (etaSeconds: number) => {
  const eta = Number(etaSeconds)
  if (eta < 0) return '—（无逼近趋势）'
  if (eta > 60) return '>60s'
  return `${Math.round(eta)}s`
}

const formatRealtimeValue = (value: number) => Number(value || 0).toFixed(2)

const realtimeUnit = (processType: string) => {
  const process = String(processType || '').toUpperCase()
  if (process.includes('TEMP')) return '℃'
  return ''
}

const riskCardClass = (item: DashboardCardItem) => {
  const level = String(item.displayRiskLevel || '').toUpperCase()
  if (level === 'HIGH') return 'risk-high'
  if (level === 'MEDIUM') return 'risk-medium'
  return 'risk-low'
}

const decisionSource = (snapshot = '') => {
  if (snapshot.includes('[RULE]')) return '[RULE] 规则'
  if (snapshot.includes('[AI+RAG]')) return '[AI+RAG] AI分析'
  if (snapshot.includes('[FALLBACK]')) return '[FALLBACK] 降级'
  return '未知来源'
}

const decisionTagType = (snapshot = '') => {
  if (snapshot.includes('[RULE]')) return 'warning'
  if (snapshot.includes('[AI+RAG]')) return 'success'
  if (snapshot.includes('[FALLBACK]')) return 'info'
  return 'info'
}

const escapeHtml = (text = '') =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const highlightKb = (text = '') =>
  escapeHtml(text).replace(/(KB-\d+)/g, '<span class="kb-highlight">$1</span>')

const upsertAiCard = (item: AiAnalysisResult) => {
  aiCardsMap.value = {
    ...aiCardsMap.value,
    [item.deviceCode]: item,
  }
}

const upsertFastRisk = (item: FastRiskPayload) => {
  fastRiskMap.value = {
    ...fastRiskMap.value,
    [item.deviceCode]: item,
  }
}

const clearAiThrottleTimers = () => {
  aiThrottleTimerByDevice.forEach((timer) => window.clearTimeout(timer))
  aiThrottleTimerByDevice.clear()
}

const applyAiUpdateThrottled = (item: AiAnalysisResult) => {
  const now = Date.now()
  const lastAppliedAt = aiLastAppliedAt.get(item.deviceCode) || 0
  const elapsed = now - lastAppliedAt
  const throttleMs = 10000

  if (elapsed >= throttleMs) {
    upsertAiCard(item)
    aiLastAppliedAt.set(item.deviceCode, now)
    return
  }

  aiPendingByDevice.set(item.deviceCode, item)
  if (aiThrottleTimerByDevice.has(item.deviceCode)) return

  const remainMs = throttleMs - elapsed
  const timer = window.setTimeout(() => {
    aiThrottleTimerByDevice.delete(item.deviceCode)
    const pending = aiPendingByDevice.get(item.deviceCode)
    if (!pending) return
    aiPendingByDevice.delete(item.deviceCode)
    upsertAiCard(pending)
    aiLastAppliedAt.set(item.deviceCode, Date.now())
  }, remainMs)
  aiThrottleTimerByDevice.set(item.deviceCode, timer)
}

const loadDeviceCodes = async () => {
  const res = await getDeviceList({ pageNum: 1, pageSize: 200 })
  deviceCodes.value = res.data.records.map((d) => d.deviceCode).filter(Boolean)
}

const loadLatestForDevices = async () => {
  if (!deviceCodes.value.length) return
  await Promise.allSettled(
    deviceCodes.value.map(async (deviceCode) => {
      const res = await getAiLatest(deviceCode)
      if (res.data) {
        upsertAiCard(res.data)
      }
    }),
  )
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    const res = await getAiHistory({
      pageNum: historyPagination.pageNum,
      pageSize: historyPagination.pageSize,
      deviceCode: searchForm.deviceCode || undefined,
    })
    historyData.value = res.data.records
    historyPagination.total = res.data.total
  } finally {
    historyLoading.value = false
  }
}

const loadLatestAlarms = async () => {
  alarmLoading.value = true
  try {
    const res = await getAlarmList({ pageNum: 1, pageSize: 8 })
    latestAlarms.value = res.data.records
  } finally {
    alarmLoading.value = false
  }
}

const loadAlarmCount = async () => {
  const res = await getUnhandledAlarmCount()
  alarmCount.value = res.data
}

const loadProductionStats = async () => {
  const res = await getProductionStats('today')
  const rawRate = Number(res.data.qualificationRate || 0)
  productionStats.value = {
    totalOutput: Number(res.data.totalOutput || 0),
    qualificationRate: Number((rawRate > 1 ? rawRate : rawRate * 100).toFixed(2)),
    lastUpdated: new Date().toLocaleString(),
  }
}

const handleSearch = () => {
  historyPagination.pageNum = 1
  loadHistory()
}

const handleReset = () => {
  searchForm.deviceCode = ''
  historyPagination.pageNum = 1
  loadHistory()
}

const refreshAll = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadProcessDict(),
      (async () => {
        await loadDeviceCodes()
        await loadLatestForDevices()
      })(),
      loadHistory(),
      loadLatestAlarms(),
      loadAlarmCount(),
      loadProductionStats(),
    ])
  } finally {
    loading.value = false
  }
}

const parseAiPayload = (raw: string): AiAnalysisResult | null => {
  try {
    const message = JSON.parse(raw) as Record<string, any>
    if (String(message.type || '').toLowerCase() !== 'ai_analysis') return null
    const payload = (message.data || message) as AiAnalysisResult
    if (!payload.deviceCode) return null
    return payload
  } catch (error) {
    console.error('AI dashboard WS 解析失败:', error)
    return null
  }
}

const parseFastRiskPayload = (raw: string): FastRiskPayload | null => {
  try {
    const message = JSON.parse(raw) as Record<string, any>
    if (String(message.type || '').toLowerCase() !== 'fast_risk') return null
    const payload = (message.data || message) as Record<string, any>

    if (!payload.deviceCode || !payload.riskLevel) return null

    return {
      deviceCode: String(payload.deviceCode),
      batchNo: String(payload.batchNo || ''),
      processType: String(payload.processType || ''),
      currentValue: Number(payload.currentValue || 0),
      riskFast: Number(payload.riskFast || 0),
      riskLevel: String(payload.riskLevel || 'LOW').toUpperCase(),
      deviation: Number(payload.deviation || 0),
      slope: Number(payload.slope || 0),
      volatility: Number(payload.volatility || 0),
      etaSeconds: Number(payload.etaSeconds ?? -1),
      target: Number(payload.target || 0),
      minThreshold: Number(payload.minThreshold || 0),
      maxThreshold: Number(payload.maxThreshold || 0),
      timestamp: Number(payload.timestamp || Date.now()),
    }
  } catch {
    return null
  }
}

const parseAlarmPayload = (raw: string): AlarmPushData | null => {
  try {
    const message = JSON.parse(raw) as Record<string, any>
    const type = String(message.type || '').toLowerCase()
    if (type !== 'alarm' && type !== 'alert' && type !== 'warning') return null
    const payload = (message.data || message) as AlarmPushData
    if (!payload.deviceCode || !payload.alarmMsg) return null
    return payload
  } catch {
    return null
  }
}

const scheduleAlarmRefresh = () => {
  if (alarmRefreshTimer) return
  alarmRefreshTimer = window.setTimeout(() => {
    alarmRefreshTimer = null
    void loadLatestAlarms()
  }, 300)
}

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

const connectWs = () => {
  clearReconnectTimer()
  if (ws) {
    ws.close()
    ws = null
  }

  ws = new WebSocket(WS_URL)
  ws.onopen = () => {
    wsConnected.value = true
  }
  ws.onmessage = (event) => {
    const fastRisk = parseFastRiskPayload(event.data)
    if (fastRisk) {
      upsertFastRisk(fastRisk)
      return
    }

    const aiData = parseAiPayload(event.data)
    if (aiData) {
      applyAiUpdateThrottled(aiData)
      return
    }

    const alarmData = parseAlarmPayload(event.data)
    if (!alarmData) return

    alarmCount.value += 1
    scheduleAlarmRefresh()
  }
  ws.onerror = () => {
    wsConnected.value = false
  }
  ws.onclose = () => {
    wsConnected.value = false
    reconnectTimer = window.setTimeout(connectWs, 3000)
  }
}

const startStatsPolling = () => {
  statsRefreshTimer = window.setInterval(() => {
    void loadProductionStats()
  }, STATS_REFRESH_INTERVAL)
}

const stopStatsPolling = () => {
  if (statsRefreshTimer) {
    window.clearInterval(statsRefreshTimer)
    statsRefreshTimer = null
  }
}

const clearAlarmRefreshTimer = () => {
  if (alarmRefreshTimer) {
    window.clearTimeout(alarmRefreshTimer)
    alarmRefreshTimer = null
  }
}

onMounted(async () => {
  await refreshAll()
  connectWs()
  startStatsPolling()
})

onBeforeUnmount(() => {
  clearReconnectTimer()
  stopStatsPolling()
  clearAlarmRefreshTimer()
  clearAiThrottleTimers()
  aiPendingByDevice.clear()
  aiLastAppliedAt.clear()
  fastRiskMap.value = {}
  if (ws) {
    ws.close()
    ws = null
  }
})
</script>

<style scoped>
.container {
  padding: 20px;
}

.box-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-row {
  margin-bottom: 12px;
}

.stats-time {
  margin-bottom: 12px;
  color: #909399;
  font-size: 12px;
}

.device-card {
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
}

.risk-high {
  border-color: #f56c6c;
  box-shadow: 0 0 0 1px rgba(245, 108, 108, 0.25);
}

.risk-medium {
  border-color: #e6a23c;
  box-shadow: 0 0 0 1px rgba(230, 162, 60, 0.25);
}

.risk-low {
  border-color: #67c23a;
}

.device-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-code {
  font-size: 16px;
  font-weight: 600;
}

.device-process {
  color: #606266;
  margin-top: 2px;
}

.gauge-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.realtime-section {
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
  margin-bottom: 10px;
}

.realtime-empty {
  margin-bottom: 10px;
  color: #909399;
  font-size: 12px;
}

.ai-divider {
  margin-bottom: 8px;
  color: #909399;
  font-size: 12px;
}

.quick-metrics {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: #606266;
  font-size: 12px;
}

.compact-line {
  margin-bottom: 6px;
}

.risk-number {
  font-size: 18px;
  font-weight: 600;
}

.line-item {
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
}

.line-label {
  width: 70px;
  color: #606266;
  flex-shrink: 0;
}

.line-content {
  color: #303133;
  line-height: 1.5;
  word-break: break-word;
}

:deep(.kb-highlight) {
  display: inline-block;
  font-weight: 700;
  color: #d97706;
  background: #fffbeb;
  border-radius: 4px;
  padding: 0 4px;
  margin: 0 2px;
}

.search-form {
  margin-bottom: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: 220px;
}

.pagination {
  margin-top: 12px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-form {
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
  }
}
</style>
