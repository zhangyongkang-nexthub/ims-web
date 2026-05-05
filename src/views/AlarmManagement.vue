<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>异常报警</span>
          <div class="header-right">
            <el-tag type="danger">未处理：{{ unhandledCount }}</el-tag>
            <el-button @click="refreshCount">刷新数量</el-button>
          </div>
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
          v-model="searchForm.processType"
          placeholder="工艺类型"
          clearable
          class="search-select"
        >
          <el-option label="温度" value="Temp" />
          <el-option label="压力" value="Pressure" />
          <el-option label="流量" value="Flow" />
          <el-option label="转速" value="Speed" />
        </el-select>
        <el-select
          v-model="searchForm.isHandled"
          placeholder="处理状态"
          clearable
          class="search-select"
        >
          <el-option label="未处理" :value="0" />
          <el-option label="已处理" :value="1" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="alarmId" label="报警ID" width="90" />
        <el-table-column prop="batchNo" label="批次号" width="140" />
        <el-table-column prop="deviceCode" label="设备编码" width="120" />
        <el-table-column label="计入不良品" width="130">
          <template #default="scope">
            <el-tag v-if="isBadQtyCounted(scope.row.deviceCode)" type="danger">已计入</el-tag>
            <el-tag v-else type="info">未计入</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="processType" label="工艺类型" width="100" />
        <el-table-column label="报警等级" width="100">
          <template #default="scope">
            <el-tag :type="levelTagType(scope.row.alarmLevel)">{{ scope.row.alarmLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentValue" label="当前值" width="90" />
        <el-table-column prop="standardRange" label="标准范围" width="150" />
        <el-table-column prop="alarmMsg" label="报警信息" min-width="260" show-overflow-tooltip />
        <el-table-column label="处理状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isHandled === 1 ? 'success' : 'warning'">
              {{ scope.row.isHandled === 1 ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handleUser" label="处理人" width="110" />
        <el-table-column prop="handleTime" label="处理时间" width="170" />
        <el-table-column prop="createTime" label="报警时间" width="170" />
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.isHandled === 0"
              link
              type="primary"
              size="small"
              @click="openHandleDialog(scope.row)"
            >
              处理
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @change="getList"
        class="pagination"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="处理报警" width="420px">
      <el-form ref="formRef" :model="handleForm" :rules="rules" label-width="90px">
        <el-form-item label="报警ID">
          <span>{{ handleForm.alarmId || '-' }}</span>
        </el-form-item>
        <el-form-item label="处理人" prop="handleUser">
          <el-input v-model="handleForm.handleUser" placeholder="请输入处理人" />
        </el-form-item>
        <el-form-item label="处理备注" prop="handleRemark">
          <el-input
            v-model="handleForm.handleRemark"
            type="textarea"
            :rows="3"
            placeholder="请输入处理说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitHandle">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { getAlarmList, getUnhandledAlarmCount, handleAlarm, type AlarmRecord } from '@/api/alarm'
import { getDeviceList } from '@/api/device'
import { onAlarmPush } from '@/utils/alarmWs'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const tableData = ref<AlarmRecord[]>([])
const unhandledCount = ref(0)
const formRef = ref<FormInstance>()
const refreshTimer = ref<number | null>(null)
const sensorCategoryMap = ref<Record<string, 'PROCESS' | 'PER_BOTTLE' | null>>({})
let stopAlarmListener: (() => void) | null = null

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  deviceCode: '',
  processType: '',
  isHandled: undefined as number | undefined,
})

const handleForm = reactive({
  alarmId: 0,
  handleUser: '',
  handleRemark: '',
})

const rules = {
  handleUser: [{ required: true, message: '请输入处理人', trigger: 'blur' }],
  handleRemark: [{ required: true, message: '请输入处理备注', trigger: 'blur' }],
}

const levelTagType = (level: string) => {
  if (level === 'CRITICAL') return 'danger'
  if (level === 'WARNING') return 'warning'
  if (level === 'INFO') return 'info'
  return 'primary'
}

const isBadQtyCounted = (deviceCode: string) => {
  return sensorCategoryMap.value[deviceCode] === 'PER_BOTTLE'
}

const loadDeviceCategories = async () => {
  const res = await getDeviceList({ pageNum: 1, pageSize: 1000 })
  sensorCategoryMap.value = res.data.records.reduce<Record<string, 'PROCESS' | 'PER_BOTTLE' | null>>(
    (acc, item) => {
      acc[item.deviceCode] = item.sensorCategory || null
      return acc
    },
    {},
  )
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getAlarmList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      deviceCode: searchForm.deviceCode || undefined,
      processType: searchForm.processType || undefined,
      isHandled: searchForm.isHandled,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

const refreshCount = async () => {
  const res = await getUnhandledAlarmCount()
  unhandledCount.value = res.data
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}

const handleReset = () => {
  searchForm.deviceCode = ''
  searchForm.processType = ''
  searchForm.isHandled = undefined
  pagination.pageNum = 1
  getList()
}

const openHandleDialog = (row: AlarmRecord) => {
  if (!row.alarmId) {
    ElMessage.warning('该告警尚未生成可处理ID，请稍后刷新后再试')
    return
  }
  handleForm.alarmId = row.alarmId
  handleForm.handleUser = ''
  handleForm.handleRemark = ''
  dialogVisible.value = true
}

const scheduleRefresh = () => {
  if (refreshTimer.value) return
  refreshTimer.value = window.setTimeout(async () => {
    refreshTimer.value = null
    await Promise.all([getList(), refreshCount()])
  }, 300)
}

const clearRefreshTimer = () => {
  if (refreshTimer.value) {
    window.clearTimeout(refreshTimer.value)
    refreshTimer.value = null
  }
}

const submitHandle = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await handleAlarm({
      alarmId: handleForm.alarmId,
      handleUser: handleForm.handleUser,
      handleRemark: handleForm.handleRemark,
    })
    ElMessage.success('处理成功')
    dialogVisible.value = false
    await Promise.all([getList(), refreshCount()])
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([getList(), refreshCount(), loadDeviceCategories()])
  stopAlarmListener = onAlarmPush(() => {
    scheduleRefresh()
  })
})

onBeforeUnmount(() => {
  if (stopAlarmListener) {
    stopAlarmListener()
    stopAlarmListener = null
  }
  clearRefreshTimer()
})
</script>

<style scoped>
.container {
  padding: 20px;
}

.box-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input,
.search-select {
  width: 200px;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
