<template>
  <div class="dashboard-container" v-loading="loading">
    <section class="hero-panel">
      <div>
        <p class="hero-kicker">SMART OPERATIONS</p>
        <h1>制造运营数据看板</h1>
        <p class="hero-desc">
          汇总报警、生产、设备和维修四类核心指标，并保留 WebSocket 实时设备快照，便于同时查看趋势和现场状态。
        </p>
      </div>
      <div class="hero-actions">
        <el-radio-group v-model="activeRange" size="large" @change="loadDashboardStats">
          <el-radio-button label="today">今天</el-radio-button>
          <el-radio-button label="7d">近7天</el-radio-button>
          <el-radio-button label="30d">近30天</el-radio-button>
        </el-radio-group>
        <el-button :loading="loading" @click="loadDashboardStats">刷新统计</el-button>
      </div>
    </section>

    <el-row :gutter="16" class="summary-grid">
      <el-col :xs="24" :sm="12" :xl="6">
        <div class="summary-card danger-card">
          <div class="summary-icon">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <div>
            <div class="summary-value">{{ alarmStats.totalCount }}</div>
            <div class="summary-label">报警总数</div>
            <div class="summary-sub">未处理 {{ alarmStats.unhandledCount }}，高等级 {{ alarmStats.criticalCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :xl="6">
        <div class="summary-card success-card">
          <div class="summary-icon">
            <el-icon><Histogram /></el-icon>
          </div>
          <div>
            <div class="summary-value">{{ productionStats.totalOutput }}</div>
            <div class="summary-label">累计产量</div>
            <div class="summary-sub">合格数 {{ productionStats.qualifiedOutput }}，合格率 {{ formatPercent(productionStats.qualificationRate) }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :xl="6">
        <div class="summary-card neutral-card">
          <div class="summary-icon">
            <el-icon><Monitor /></el-icon>
          </div>
          <div>
            <div class="summary-value">{{ equipmentStats.totalCount }}</div>
            <div class="summary-label">设备总数</div>
            <div class="summary-sub">正常 {{ equipmentStats.normalCount }}，故障 {{ equipmentStats.faultCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :xl="6">
        <div class="summary-card warm-card">
          <div class="summary-icon">
            <el-icon><Tools /></el-icon>
          </div>
          <div>
            <div class="summary-value">{{ repairStats.totalCount }}</div>
            <div class="summary-label">维修工单</div>
            <div class="summary-sub">AI {{ repairStats.aiCreatedCount }}，人工 {{ repairStats.manualCreatedCount }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="main-grid">
      <el-col :xs="24" :xl="15">
        <el-card class="panel-card trend-panel">
          <template #header>
            <div class="panel-head">
              <span>报警趋势</span>
              <el-tag type="danger">{{ activeRange }}</el-tag>
            </div>
          </template>

          <el-empty v-if="!alarmTrend.length" description="暂无报警趋势数据" />

          <div v-else class="trend-list">
            <div v-for="item in alarmTrend" :key="item.label" class="trend-item">
              <span class="trend-label">{{ item.label }}</span>
              <div class="trend-bar-wrap danger-track">
                <div class="trend-bar danger-bar" :style="{ width: `${item.percent}%` }"></div>
              </div>
              <strong class="trend-value">{{ item.value }}</strong>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :xl="9">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-head">
              <span>设备状态分布</span>
              <el-tag type="info">总计 {{ equipmentStats.totalCount }}</el-tag>
            </div>
          </template>

          <div class="status-stack">
            <div v-for="item in equipmentDistribution" :key="item.label" class="status-item">
              <div class="status-row">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
              <div class="status-track">
                <div class="status-fill" :class="item.className" :style="{ width: `${item.percent}%` }"></div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="main-grid">
      <el-col :xs="24" :xl="15">
        <el-card class="panel-card trend-panel">
          <template #header>
            <div class="panel-head">
              <span>生产趋势</span>
              <div class="header-tags">
                <el-tag type="success">总产量 {{ productionStats.totalOutput }}</el-tag>
                <el-tag type="success" effect="plain">合格率 {{ formatPercent(productionStats.qualificationRate) }}</el-tag>
              </div>
            </div>
          </template>

          <el-empty v-if="!productionTrend.length" description="暂无生产趋势数据" />

          <div v-else class="production-list">
            <div v-for="item in productionTrend" :key="item.label" class="production-item">
              <div class="production-top">
                <span class="trend-label">{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
              <div class="trend-bar-wrap success-track">
                <div class="trend-bar success-bar" :style="{ width: `${item.percent}%` }"></div>
              </div>
              <div class="production-meta">合格率 {{ formatPercent(item.rate ?? 0) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :xl="9">
        <el-card class="panel-card repair-panel">
          <template #header>
            <div class="panel-head">
              <span>维修工单统计</span>
              <el-tag type="warning">{{ activeRange }}</el-tag>
            </div>
          </template>

          <div class="repair-grid">
            <div class="repair-metric">
              <span>待修</span>
              <strong>{{ repairStats.pendingCount }}</strong>
            </div>
            <div class="repair-metric">
              <span>维修中</span>
              <strong>{{ repairStats.processingCount }}</strong>
            </div>
            <div class="repair-metric">
              <span>已完成</span>
              <strong>{{ repairStats.completedCount }}</strong>
            </div>
            <div class="repair-metric accent">
              <span>AI 自动建单占比</span>
              <strong>{{ repairCreationRate }}</strong>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="panel-card realtime-card">
      <template #header>
        <div class="panel-head">
          <span>实时设备快照</span>
          <el-tag type="success" v-if="realtime.lastUpdated">更新时间：{{ realtime.lastUpdated }}</el-tag>
          <el-tag type="info" v-else>等待实时数据</el-tag>
        </div>
      </template>

      <el-empty v-if="deviceMetricsList.length === 0" description="暂无设备实时数据" />

      <el-row v-else :gutter="16">
        <el-col
          v-for="device in deviceMetricsList"
          :key="device.deviceCode"
          :xs="24"
          :sm="12"
          :lg="8"
        >
          <div class="device-card">
            <div class="device-header">
              <span class="device-code">{{ device.deviceCode }}</span>
              <el-tag size="small" type="warning">实时</el-tag>
            </div>
            <div class="metric-list">
              <div class="metric-item">
                <span class="metric-label">当前值</span>
                <span class="metric-value">{{ device.currentValue }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">类型</span>
                <span class="metric-value">{{ device.processType }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">生产批次</span>
                <span class="metric-value">{{ device.batchNo }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {
  getAlarmStats,
  getEquipmentOverview,
  getProductionStats,
  getRepairStats,
  type DashboardRange,
  type TrendItem,
} from '@/api/dashboard'
import { onDashboardPush, type DashboardDeviceValue, type DashboardPushData } from '@/utils/alarmWs'
import { Histogram, Monitor, Tools, WarningFilled } from '@element-plus/icons-vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type UnknownRecord = Record<string, unknown>

interface AlarmStatsView {
  totalCount: number
  unhandledCount: number
  criticalCount: number
}

interface ProductionStatsView {
  totalOutput: number
  qualifiedOutput: number
  qualificationRate: number
}

interface EquipmentStatsView {
  totalCount: number
  normalCount: number
  warningCount: number
  faultCount: number
}

interface RepairStatsView {
  totalCount: number
  pendingCount: number
  processingCount: number
  completedCount: number
  aiCreatedCount: number
  manualCreatedCount: number
}

interface TrendViewItem {
  label: string
  value: number
  percent: number
  rate?: number
}

const loading = ref(false)
const activeRange = ref<DashboardRange>('7d')
const alarmStats = ref<AlarmStatsView>({ totalCount: 0, unhandledCount: 0, criticalCount: 0 })
const productionStats = ref<ProductionStatsView>({
  totalOutput: 0,
  qualifiedOutput: 0,
  qualificationRate: 0,
})
const equipmentStats = ref<EquipmentStatsView>({
  totalCount: 0,
  normalCount: 0,
  warningCount: 0,
  faultCount: 0,
})
const repairStats = ref<RepairStatsView>({
  totalCount: 0,
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
  aiCreatedCount: 0,
  manualCreatedCount: 0,
})
const alarmTrend = ref<TrendViewItem[]>([])
const productionTrend = ref<TrendViewItem[]>([])
const realtime = ref({
  productionCount: 0,
  devices: {} as DashboardPushData['devices'],
  lastUpdated: '',
})

let stopDashboardListener: (() => void) | null = null

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function pickNumber(source: UnknownRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
      return Number(value)
    }
  }
  return fallback
}

function pickArray(source: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (Array.isArray(value)) return value
  }
  return []
}

function formatMetricValue(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2)
}

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  const seconds = `${date.getSeconds()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function formatPercent(value: number) {
  const normalized = value > 1 ? value : value * 100
  return `${normalized.toFixed(1)}%`
}

function getCurrentValue(deviceValue: DashboardDeviceValue) {
  if (typeof deviceValue === 'number') {
    return formatMetricValue(deviceValue)
  }

  if (typeof deviceValue.value === 'number') {
    return formatMetricValue(deviceValue.value)
  }

  const fallbackMetric = Object.values(deviceValue).find((value) => typeof value === 'number')
  return typeof fallbackMetric === 'number' ? formatMetricValue(fallbackMetric) : '-'
}

function normalizeTrend(items: unknown[], valueKeys: string[], rateKeys?: string[]) {
  const rawValues = items.map((item) => {
    const row = isRecord(item) ? item : {}
    const label =
      (row.date as string) ||
      (row.day as string) ||
      (row.label as string) ||
      (row.statDate as string) ||
      '-'
    const value = pickNumber(row, valueKeys)
    const rate = rateKeys ? pickNumber(row, rateKeys) : undefined
    return { label, value, rate }
  })
  const maxValue = Math.max(...rawValues.map((item) => item.value), 1)

  return rawValues.map((item) => ({
    ...item,
    percent: Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0),
  }))
}

function normalizeAlarmStats(payload: unknown) {
  const source = isRecord(payload) ? payload : {}
  alarmStats.value = {
    totalCount: pickNumber(source, ['totalCount', 'alarmCount', 'totalAlarms', 'total']),
    unhandledCount: pickNumber(source, ['unhandledCount', 'pendingCount', 'untreatedCount']),
    criticalCount: pickNumber(source, ['criticalCount', 'highLevelCount', 'highRiskCount']),
  }
  alarmTrend.value = normalizeTrend(
    pickArray(source, ['dailyTrend', 'trend', 'items', 'details']),
    ['count', 'alarmCount', 'value', 'total'],
  )
}

function normalizeProductionStats(payload: unknown) {
  const source = isRecord(payload) ? payload : {}
  const totalActualQty = pickNumber(source, ['totalActualQty', 'totalOutput', 'output', 'productionCount'])
  const totalBadQty = pickNumber(source, ['totalBadQty', 'badQty', 'defectCount'])
  const qualifiedOutput = pickNumber(
    source,
    ['qualifiedOutput', 'qualifiedCount', 'passCount'],
    Math.max(totalActualQty - totalBadQty, 0),
  )
  productionStats.value = {
    totalOutput: totalActualQty,
    qualifiedOutput,
    qualificationRate: pickNumber(source, ['qualificationRate', 'passRate', 'qualifiedRate', 'yieldRate']),
  }
  productionTrend.value = normalizeTrend(
    pickArray(source, ['dailyTrend', 'trend', 'items', 'details']),
    ['total', 'count', 'output', 'value', 'productionCount', 'totalActualQty', 'totalBatches'],
    ['qualificationRate', 'passRate', 'qualifiedRate', 'yieldRate'],
  )
}

function normalizeEquipmentStats(payload: unknown) {
  const source = isRecord(payload) ? payload : {}
  equipmentStats.value = {
    totalCount: pickNumber(source, ['totalCount', 'equipmentCount', 'total']),
    normalCount: pickNumber(source, ['normalCount', 'runningCount', 'healthyCount', 'running']),
    warningCount: pickNumber(source, ['warningCount', 'alertCount', 'stopped']),
    faultCount: pickNumber(source, ['faultCount', 'errorCount', 'offlineCount']),
  }
}

function normalizeRepairStats(payload: unknown) {
  const source = isRecord(payload) ? payload : {}
  repairStats.value = {
    totalCount: pickNumber(source, ['totalCount', 'repairCount', 'total', 'totalOrders']),
    pendingCount: pickNumber(source, ['pendingCount', 'todoCount', 'waitingCount']),
    processingCount: pickNumber(source, ['processingCount', 'repairingCount', 'inProgressCount']),
    completedCount: pickNumber(source, ['completedCount', 'doneCount', 'finishedCount']),
    aiCreatedCount: pickNumber(source, ['aiCreatedCount', 'aiCount', 'autoCreatedCount', 'aiTriggeredCount']),
    manualCreatedCount: pickNumber(source, ['manualCreatedCount', 'manualCount', 'humanCreatedCount']),
  }
}

const equipmentDistribution = computed(() => {
  const total = Math.max(equipmentStats.value.totalCount, 1)
  return [
    {
      label: '正常',
      value: equipmentStats.value.normalCount,
      percent: (equipmentStats.value.normalCount / total) * 100,
      className: 'normal-fill',
    },
    {
      label: '预警',
      value: equipmentStats.value.warningCount,
      percent: (equipmentStats.value.warningCount / total) * 100,
      className: 'warning-fill',
    },
    {
      label: '故障',
      value: equipmentStats.value.faultCount,
      percent: (equipmentStats.value.faultCount / total) * 100,
      className: 'fault-fill',
    },
  ]
})

const repairCreationRate = computed(() => {
  if (!repairStats.value.totalCount) return '0.0%'
  return `${((repairStats.value.aiCreatedCount / repairStats.value.totalCount) * 100).toFixed(1)}%`
})

const deviceMetricsList = computed(() => {
  return Object.entries(realtime.value.devices).map(([deviceCode, metrics]) => {
    if (typeof metrics === 'number') {
      return {
        deviceCode,
        currentValue: formatMetricValue(metrics),
        processType: '-',
        batchNo: '-',
      }
    }

    return {
      deviceCode: metrics.deviceCode || deviceCode,
      currentValue: getCurrentValue(metrics),
      processType: metrics.processType || '-',
      batchNo: metrics.batchNo || '-',
    }
  })
})

async function loadDashboardStats() {
  loading.value = true
  try {
    const [alarmRes, productionRes, equipmentRes, repairRes] = await Promise.all([
      getAlarmStats(activeRange.value),
      getProductionStats(activeRange.value),
      getEquipmentOverview(),
      getRepairStats(activeRange.value),
    ])

    normalizeAlarmStats(alarmRes.data)
    normalizeProductionStats(productionRes.data)
    normalizeEquipmentStats(equipmentRes.data)
    normalizeRepairStats(repairRes.data)
  } finally {
    loading.value = false
  }
}

function updateDashboardRealtime(data: DashboardPushData) {
  realtime.value = {
    productionCount: data.productionCount,
    devices: data.devices,
    lastUpdated: formatTimestamp(data.timestamp),
  }
}

onMounted(async () => {
  await loadDashboardStats()
  stopDashboardListener = onDashboardPush((data) => {
    updateDashboardRealtime(data)
  })
})

onBeforeUnmount(() => {
  if (stopDashboardListener) {
    stopDashboardListener()
    stopDashboardListener = null
  }
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background:
    radial-gradient(circle at top left, rgba(255, 191, 105, 0.16), transparent 24%),
    linear-gradient(180deg, #fffaf2 0%, #f7f9fc 36%, #ffffff 100%);
}

.hero-panel {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
  border-radius: 24px;
  margin-bottom: 16px;
  background:
    radial-gradient(circle at top right, rgba(251, 191, 36, 0.25), transparent 28%),
    linear-gradient(135deg, #172554 0%, #1d4ed8 54%, #0f766e 100%);
  color: #eff6ff;
}

.hero-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.28em;
  color: rgba(239, 246, 255, 0.72);
}

.hero-panel h1 {
  margin: 0;
  font-size: 34px;
}

.hero-desc {
  max-width: 720px;
  margin: 14px 0 0;
  line-height: 1.8;
  color: rgba(239, 246, 255, 0.88);
}

.hero-actions {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.summary-grid,
.main-grid {
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  gap: 16px;
  height: 100%;
  padding: 18px;
  border-radius: 22px;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.06);
}

.danger-card {
  background: linear-gradient(180deg, #fff1f2 0%, #ffffff 100%);
}

.success-card {
  background: linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%);
}

.neutral-card {
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
}

.warm-card {
  background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%);
}

.summary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 18px;
  font-size: 24px;
  color: #fff;
  background: linear-gradient(135deg, #1d4ed8 0%, #0f766e 100%);
}

.summary-value {
  font-size: 30px;
  font-weight: 700;
  color: #0f172a;
}

.summary-label {
  margin-top: 4px;
  font-size: 14px;
  color: #334155;
}

.summary-sub {
  margin-top: 6px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
}

.panel-card {
  border: none;
  border-radius: 22px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.trend-list,
.production-list,
.status-stack {
  display: grid;
  gap: 14px;
}

.trend-item,
.production-item,
.status-item {
  display: grid;
  align-items: center;
  gap: 12px;
}

.trend-item {
  grid-template-columns: 100px minmax(0, 1fr) 60px;
}

.production-top,
.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trend-label,
.production-meta,
.status-row span {
  color: #475569;
}

.trend-value,
.status-row strong,
.production-top strong {
  color: #0f172a;
}

.trend-bar-wrap,
.status-track {
  width: 100%;
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.trend-bar,
.status-fill {
  height: 100%;
  border-radius: inherit;
}

.danger-bar {
  background: linear-gradient(90deg, #fb7185 0%, #dc2626 100%);
}

.success-bar {
  background: linear-gradient(90deg, #34d399 0%, #059669 100%);
}

.normal-fill {
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
}

.warning-fill {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.fault-fill {
  background: linear-gradient(90deg, #f43f5e 0%, #be123c 100%);
}

.repair-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.repair-metric {
  padding: 18px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.repair-metric span {
  display: block;
  color: #64748b;
}

.repair-metric strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  color: #0f172a;
}

.repair-metric.accent {
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
}

.realtime-card {
  margin-top: 8px;
}

.device-card {
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.device-code {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.metric-list {
  display: grid;
  gap: 10px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
  border-radius: 10px;
}

.metric-label {
  font-size: 14px;
  color: #6b7280;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

@media (max-width: 992px) {
  .hero-panel {
    flex-direction: column;
  }

  .hero-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .hero-panel {
    padding: 20px;
  }

  .hero-panel h1 {
    font-size: 28px;
  }

  .trend-item {
    grid-template-columns: 1fr;
  }

  .repair-grid {
    grid-template-columns: 1fr;
  }
}
</style>
