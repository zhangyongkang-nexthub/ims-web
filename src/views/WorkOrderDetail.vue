<template>
  <div class="container">
    <!-- 返回按钮 -->
    <el-page-header @back="router.back()" style="margin-bottom: 16px">
      <template #content>
        <span>工单详情 - {{ detail?.woNo }}</span>
      </template>
    </el-page-header>

    <!-- 工单基本信息 -->
    <el-card class="box-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>工单信息</span>
          <div>
            <el-button v-if="canStartBatch" type="primary" @click="openStartBatchDialog"
              >启动新批次</el-button
            >
            <el-button
              v-if="detail && (detail.status === 1 || detail.status === 2)"
              type="warning"
              @click="handleCloseOrder"
              >关闭工单</el-button
            >
          </div>
        </div>
      </template>

      <el-descriptions :column="3" border v-if="detail">
        <el-descriptions-item label="工单号">{{ detail.woNo }}</el-descriptions-item>
        <el-descriptions-item label="产品">{{ detail.productName }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ detail.customerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="配方">{{ detail.recipeName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(detail.status)">{{ detail.statusLabel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="计划开始">{{
          detail.plannedStart || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="计划结束">{{ detail.plannedEnd || '-' }}</el-descriptions-item>
        <el-descriptions-item label="生产进度">
          <div style="width: 200px">
            <span>{{ detail.completedQty }} / {{ detail.targetQty }}</span>
            <el-progress :percentage="progressPercent" :stroke-width="8" style="margin-top: 4px" />
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 批次列表 -->
    <el-card class="box-card" style="margin-top: 16px">
      <template #header>
        <span>批次记录</span>
      </template>

      <el-table :data="detail?.batchList || []" stripe style="width: 100%" row-key="batchId">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding: 12px 48px">
              <h4 style="margin-bottom: 8px">投料明细</h4>
              <el-table
                v-if="row.consumptionList && row.consumptionList.length"
                :data="row.consumptionList"
                size="small"
                border
              >
                <el-table-column prop="lotNo" label="物料批次号" width="180" />
                <el-table-column prop="mName" label="物料名称" width="140" />
                <el-table-column prop="consumeQty" label="消耗量" width="100" />
                <el-table-column prop="uom" label="单位" width="80" />
                <el-table-column prop="feedTime" label="投料时间" width="170" />
                <el-table-column prop="sourceTypeLabel" label="来源" width="100" />
              </el-table>
              <el-empty v-else description="暂无投料记录" :image-size="60" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="batchNo" label="批次号" width="200" />
        <el-table-column prop="targetQty" label="计划产量" width="100" align="center" />
        <el-table-column prop="actualQty" label="实际产出" width="100" align="center" />
        <el-table-column prop="badQty" label="不良品" width="90" align="center" />
        <el-table-column label="合格数" width="90" align="center">
          <template #default="{ row }">{{ row.goodQty ?? row.actualQty - row.badQty }}</template>
        </el-table-column>
        <el-table-column prop="batchStatusLabel" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.batchStatus === 1 ? 'success' : 'info'">
              {{ row.batchStatusLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作员" width="100" />
        <el-table-column prop="startTime" label="开始时间" width="170" />
        <el-table-column prop="endTime" label="结束时间" width="170">
          <template #default="{ row }">{{ row.endTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="row.batchStatus === 1">
              <el-button link type="primary" size="small" @click="openReportDialog(row)"
                >报工</el-button
              >
              <el-button link type="success" size="small" @click="handleCompleteBatch(row)"
                >完成</el-button
              >
            </template>
            <span v-else style="color: #909399; font-size: 12px">展开查看投料</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 启动批次弹窗 -->
    <el-dialog v-model="startBatchVisible" title="启动新批次" width="400px">
      <el-form label-width="110px">
        <el-form-item label="剩余产量">
          <span style="font-weight: bold; color: #e6a23c">{{ remaining }}</span>
        </el-form-item>
        <el-form-item label="本批次产量" required>
          <el-input-number
            v-model="batchForm.batchTargetQty"
            :min="1"
            :max="remaining"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="操作员">
          <el-select
            v-model="batchForm.operatorId"
            placeholder="选择操作员（可选）"
            filterable
            clearable
          >
            <el-option v-for="u in userList" :key="u.id" :label="u.nickname" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="startBatchVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleStartBatch"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <!-- 报工弹窗 -->
    <el-dialog v-model="reportVisible" title="批次报工" width="400px">
      <el-form label-width="110px">
        <el-form-item label="本次产出数量" required>
          <el-input-number v-model="reportForm.actualQty" :min="1" style="width: 200px" />
        </el-form-item>
        <el-form-item label="本次不良品数">
          <el-input-number v-model="reportForm.badQty" :min="0" style="width: 200px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleReport">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { getUserList, type User } from '@/api/user'
import {
  closeWorkOrder,
  completeBatch,
  getWorkOrderDetail,
  reportBatch,
  startBatch,
  type Batch,
  type WorkOrderDetail,
} from '@/api/workOrder'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const woId = String(route.params.woId ?? '')
const loading = ref(false)
const submitLoading = ref(false)
const detail = ref<WorkOrderDetail | null>(null)
const userList = ref<User[]>([])

// ---- 计算属性 ----
const remaining = computed(() => {
  if (!detail.value) return 0
  return detail.value.targetQty - detail.value.completedQty
})

const progressPercent = computed(() => {
  if (!detail.value || detail.value.targetQty === 0) return 0
  return Math.min(Math.round((detail.value.completedQty / detail.value.targetQty) * 100), 100)
})

const hasRunningBatch = computed(() => {
  return detail.value?.batchList?.some((b) => b.batchStatus === 1) ?? false
})

const canStartBatch = computed(() => {
  if (!detail.value) return false
  const s = detail.value.status
  // 待生产(0) 或 生产中(1) 且没有运行中批次 且有剩余产量
  return (s === 0 || s === 1) && !hasRunningBatch.value && remaining.value > 0
})

const statusTagType = (status: number) => {
  const map: Record<number, string> = { 0: 'info', 1: '', 2: 'success', 3: 'danger' }
  return map[status] ?? 'info'
}

// ---- 加载数据 ----
const loadDetail = async () => {
  loading.value = true
  try {
    const res = await getWorkOrderDetail(woId)
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  const res = await getUserList({ pageSize: 1000 })
  userList.value = res.data.records
}

// ---- 启动批次 ----
const startBatchVisible = ref(false)
const batchForm = reactive({ batchTargetQty: 0, operatorId: undefined as number | undefined })

const openStartBatchDialog = () => {
  batchForm.batchTargetQty = remaining.value
  batchForm.operatorId = undefined
  startBatchVisible.value = true
}

const handleStartBatch = async () => {
  if (batchForm.batchTargetQty <= 0) {
    ElMessage.warning('请输入本批次计划产量')
    return
  }
  submitLoading.value = true
  try {
    const res = await startBatch(woId, {
      batchTargetQty: batchForm.batchTargetQty,
      operatorId: batchForm.operatorId,
    })
    ElMessage.success(`批次已启动，批次号: ${res.data}`)
    startBatchVisible.value = false
    loadDetail()
  } catch (error) {
    console.error('启动批次失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// ---- 报工 ----
const reportVisible = ref(false)
const reportBatchId = ref('')
const reportForm = reactive({ actualQty: 0, badQty: 0 })

const openReportDialog = (row: Batch) => {
  reportBatchId.value = String(row.batchId)
  reportForm.actualQty = 0
  reportForm.badQty = 0
  reportVisible.value = true
}

const handleReport = async () => {
  if (reportForm.actualQty <= 0) {
    ElMessage.warning('请输入产出数量')
    return
  }
  submitLoading.value = true
  try {
    await reportBatch(reportBatchId.value, {
      actualQty: reportForm.actualQty,
      badQty: reportForm.badQty,
    })
    ElMessage.success('报工成功')
    reportVisible.value = false
    loadDetail()
  } catch (error) {
    console.error('报工失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// ---- 完成批次 ----
const handleCompleteBatch = (row: Batch) => {
  ElMessageBox.confirm('确定完成该批次吗？后端将自动累加合格数并生成待入库记录。', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await completeBatch(row.batchId)
        ElMessage.success('批次已完成')
        loadDetail()
      } catch (error) {
        console.error('完成批次失败:', error)
      }
    })
    .catch(() => {})
}

// ---- 关闭工单 ----
const handleCloseOrder = () => {
  if (hasRunningBatch.value) {
    ElMessage.warning('还有运行中的批次，无法关闭工单')
    return
  }
  ElMessageBox.confirm('确定关闭/结案该工单吗？', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await closeWorkOrder(woId)
        ElMessage.success('工单已关闭')
        loadDetail()
      } catch (error) {
        console.error('关闭工单失败:', error)
      }
    })
    .catch(() => {})
}

// ---- 初始化 ----
onMounted(() => {
  loadDetail()
  loadUsers()
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
