<template>
  <div class="container">
    <el-card class="box-card" v-loading="loading" element-loading-text="AI 正在分析，请稍候（约5-15秒）...">
      <template #header>
        <div class="card-header">
          <span>设备运行日报 + AI 维保建议</span>
        </div>
      </template>

      <div class="toolbar">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          value-format="YYYY-MM-DD"
          format="YYYY-MM-DD"
          placeholder="选择日报日期"
          :disabled-date="disabledDate"
          clearable="false"
          class="date-picker"
        />
        <el-button type="primary" :loading="loading" @click="handleGenerateByDate">
          生成指定日期日报
        </el-button>
        <el-button :loading="loading" @click="handleGenerateToday">生成今日日报</el-button>
        <el-button :loading="loading" @click="handleLoadLatest">读取最近缓存</el-button>
      </div>

      <div class="meta-row">
        <el-tag type="info">报告日期：{{ report?.reportDate || '-' }}</el-tag>
        <el-tag type="success">生成时间：{{ report?.generateTime || '-' }}</el-tag>
      </div>

      <el-empty v-if="!report && !loading" :description="emptyTip" />

      <div v-else-if="report" class="content-wrap">
        <el-card shadow="never" class="section-card">
          <template #header>
            <span>AI 产线全局日评</span>
          </template>
          <div class="overview-text">{{ report.aiDailyOverview || '暂无AI总评' }}</div>
        </el-card>

        <el-card shadow="never" class="section-card">
          <template #header>
            <span>设备运行概况（{{ deviceSummaries.length }} 台）</span>
          </template>
          <el-table :data="deviceSummaries" stripe border style="width: 100%">
            <el-table-column prop="deviceCode" label="设备编码" width="120" />
            <el-table-column prop="equipName" label="设备名称" min-width="140" />
            <el-table-column prop="deviceType" label="类型" width="100" />
            <el-table-column prop="sampleCount" label="采样数" width="110" />
            <el-table-column label="均值" width="110">
              <template #default="{ row }">{{ formatNumber(row.mean, 3) }}</template>
            </el-table-column>
            <el-table-column label="标准差" width="110">
              <template #default="{ row }">{{ formatNumber(row.stdDev, 3) }}</template>
            </el-table-column>
            <el-table-column label="超标率" width="110">
              <template #default="{ row }">
                <span :class="outRateClass(row.outOfRangeRate)">{{ formatPercent(row.outOfRangeRate) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="告警数" width="90">
              <template #default="{ row }">
                <span :class="{ 'danger-text': row.alarmCount > 0 }">{{ row.alarmCount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="健康评分" width="220">
              <template #default="{ row }">
                <div class="health-cell">
                  <el-progress
                    :percentage="normalizeScore(row.healthScore)"
                    :stroke-width="14"
                    :color="healthColor(row.healthScore)"
                  />
                  <span class="health-value">{{ formatNumber(row.healthScore, 1) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="趋势" width="100">
              <template #default="{ row }">
                <span :style="{ color: trendColor(row.trend) }">{{ trendLabel(row.trend) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="runningDays" label="运行天数" width="110" />
          </el-table>
        </el-card>

        <el-row :gutter="12" class="section-row">
          <el-col :xs="24" :lg="14">
            <el-card shadow="never" class="section-card compact">
              <template #header>
                <span>AI 维保建议（{{ sortedSuggestions.length }} 条）</span>
              </template>
              <el-empty
                v-if="!sortedSuggestions.length"
                description="暂无维保建议"
                :image-size="90"
              />
              <div v-else class="suggestion-list">
                <el-collapse>
                  <el-collapse-item
                    v-for="item in sortedSuggestions"
                    :key="`${item.deviceCode}-${item.suggestedTime}`"
                    :name="`${item.deviceCode}-${item.suggestedTime}`"
                  >
                    <template #title>
                      <div class="suggestion-title">
                        <el-tag :type="urgencyTagType(item.urgency)">
                          {{ urgencyLabel(item.urgency) }}
                        </el-tag>
                        <span>{{ item.equipName }}（{{ item.deviceCode }}）</span>
                        <span class="suggest-time">建议时间：{{ item.suggestedTime || '-' }}</span>
                      </div>
                    </template>
                    <div class="suggestion-content">建议：{{ item.suggestion || '-' }}</div>
                    <div class="suggestion-reason">依据：{{ item.reason || '-' }}</div>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="10">
            <el-card shadow="never" class="section-card compact">
              <template #header>
                <span>告警 TOP 排名</span>
              </template>
              <el-empty
                v-if="!alarmTopDevices.length"
                description="当日无明显告警"
                :image-size="90"
              />
              <el-timeline v-else>
                <el-timeline-item
                  v-for="(item, idx) in alarmTopDevices"
                  :key="`${item.deviceCode}-${idx}`"
                  :type="idx === 0 ? 'danger' : 'primary'"
                >
                  <div class="alarm-item-head">
                    <strong>{{ item.deviceCode }}</strong>
                    <el-tag size="small">{{ item.deviceType }}</el-tag>
                    <span class="danger-text">{{ item.alarmCount }}次</span>
                  </div>
                  <div class="alarm-msg">{{ item.topAlarmMsg || '-' }}</div>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {
  getDeviceDailyReportByDate,
  getLatestDeviceDailyReport,
  getTodayDeviceDailyReport,
  type DeviceAlarmTopItem,
  type DeviceDailyReport,
  type DeviceDailySummary,
  type DeviceMaintenanceSuggestion,
  type DeviceTrend,
  type DeviceUrgency,
} from '@/api/ai'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'

const loading = ref(false)
const report = ref<DeviceDailyReport | null>(null)
const emptyTip = ref('暂无日报，请选择日期后生成')
const selectedDate = ref(getYesterday())

const deviceSummaries = computed<DeviceDailySummary[]>(() => {
  return report.value?.deviceSummaries || []
})

const alarmTopDevices = computed<DeviceAlarmTopItem[]>(() => {
  return report.value?.alarmTopDevices || []
})

const sortedSuggestions = computed<DeviceMaintenanceSuggestion[]>(() => {
  const source = report.value?.maintenanceSuggestions || []
  const order: Record<DeviceUrgency, number> = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  }
  return [...source].sort((a, b) => order[a.urgency] - order[b.urgency])
})

function getYesterday() {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return formatDate(date)
}

function formatDate(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function disabledDate(time: Date) {
  const day = new Date(time)
  day.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const min = new Date(today)
  min.setDate(min.getDate() - 30)

  return day.getTime() > today.getTime() || day.getTime() < min.getTime()
}

function normalizeScore(score: number) {
  if (Number.isNaN(score)) return 0
  if (score < 0) return 0
  if (score > 100) return 100
  return Number(score.toFixed(1))
}

function healthColor(score: number) {
  if (score >= 90) return '#67c23a'
  if (score >= 70) return '#e6a23c'
  return '#f56c6c'
}

function formatNumber(value: number, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'
  return Number(value).toFixed(digits)
}

function formatPercent(value: number) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'
  return `${Number(value).toFixed(2)}%`
}

function outRateClass(value: number) {
  const rate = Number(value)
  if (Number.isNaN(rate)) return ''
  if (rate > 0.5) return 'danger-text'
  if (rate > 0.1) return 'warning-text'
  return ''
}

function trendLabel(trend: DeviceTrend) {
  if (trend === 'UP') return '↑ 好转'
  if (trend === 'DOWN') return '↓ 下降'
  return '→ 稳定'
}

function trendColor(trend: DeviceTrend) {
  if (trend === 'UP') return '#67c23a'
  if (trend === 'DOWN') return '#f56c6c'
  return '#909399'
}

function urgencyTagType(urgency: DeviceUrgency) {
  if (urgency === 'HIGH') return 'danger'
  if (urgency === 'MEDIUM') return 'warning'
  return 'success'
}

function urgencyLabel(urgency: DeviceUrgency) {
  if (urgency === 'HIGH') return '紧急'
  if (urgency === 'MEDIUM') return '中等'
  return '计划保养'
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return '请求失败'
}

async function handleLoadLatest() {
  loading.value = true
  try {
    const res = await getLatestDeviceDailyReport()
    report.value = res.data
    emptyTip.value = '暂无日报，请选择日期后生成'
    ElMessage.success('已加载最近缓存日报')
  } catch (error) {
    report.value = null
    const msg = errorMessage(error)
    if (msg.includes('暂无缓存')) {
      emptyTip.value = '暂无缓存的日报，请先生成'
      return
    }
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

async function handleGenerateByDate() {
  loading.value = true
  try {
    const res = await getDeviceDailyReportByDate(selectedDate.value)
    report.value = res.data
    emptyTip.value = '暂无日报，请选择日期后生成'
    ElMessage.success('日报生成成功')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    loading.value = false
  }
}

async function handleGenerateToday() {
  loading.value = true
  try {
    const res = await getTodayDeviceDailyReport()
    report.value = res.data
    if (res.data?.reportDate) {
      selectedDate.value = res.data.reportDate
    }
    emptyTip.value = '暂无日报，请选择日期后生成'
    ElMessage.success('今日日报生成成功')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  handleLoadLatest()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.date-picker {
  width: 220px;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.content-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-card {
  border-radius: 8px;
}

.section-row {
  margin-top: 2px;
}

.compact {
  min-height: 320px;
}

.overview-text {
  line-height: 1.8;
  white-space: pre-wrap;
  color: #303133;
}

.health-cell {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
}

.health-value {
  color: #303133;
  font-weight: 600;
}

.warning-text {
  color: #e6a23c;
  font-weight: 600;
}

.danger-text {
  color: #f56c6c;
  font-weight: 700;
}

.suggestion-list {
  max-height: 360px;
  overflow-y: auto;
}

.suggestion-title {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.suggest-time {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}

.suggestion-content {
  margin-bottom: 8px;
  color: #303133;
}

.suggestion-reason {
  color: #606266;
}

.alarm-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.alarm-msg {
  color: #606266;
}
</style>
