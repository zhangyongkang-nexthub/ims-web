<template>
  <div class="dashboard-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>实时看板</span>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <div class="stat-card highlight-card">
            <el-icon size="40" color="#13CE66"><Histogram /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ realtime.productionCount }}</div>
              <div class="stat-label">实时生产数量</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <el-card shadow="never" class="realtime-card">
        <template #header>
          <div class="section-header">
            <span>实时设备看板</span>
            <el-tag type="success" v-if="realtime.lastUpdated">
              更新时间：{{ realtime.lastUpdated }}
            </el-tag>
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onDashboardPush, type DashboardDeviceValue, type DashboardPushData } from '@/utils/alarmWs'
import { Histogram } from '@element-plus/icons-vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const realtime = ref({
  productionCount: 0,
  devices: {} as DashboardPushData['devices'],
  lastUpdated: '',
})

let stopDashboardListener: (() => void) | null = null

const formatMetricValue = (value: number) => {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2)
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  const seconds = `${date.getSeconds()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const getCurrentValue = (deviceValue: DashboardDeviceValue) => {
  if (typeof deviceValue === 'number') {
    return formatMetricValue(deviceValue)
  }

  if (typeof deviceValue.value === 'number') {
    return formatMetricValue(deviceValue.value)
  }

  const fallbackMetric = Object.values(deviceValue).find((value) => typeof value === 'number')
  return typeof fallbackMetric === 'number' ? formatMetricValue(fallbackMetric) : '-'
}

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

const updateDashboardRealtime = (data: DashboardPushData) => {
  realtime.value = {
    productionCount: data.productionCount,
    devices: data.devices,
    lastUpdated: formatTimestamp(data.timestamp),
  }
}

onMounted(() => {
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
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.highlight-card {
  background: linear-gradient(135deg, #eefbf3 0%, #d9f7e5 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.realtime-card {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.device-card {
  padding: 16px;
  border-radius: 10px;
  background: #f8fafc;
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
  border-radius: 8px;
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
</style>
