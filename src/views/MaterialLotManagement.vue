<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>材料入库管理</span>
          <el-button type="primary" @click="openRegisterPage">登记</el-button>
        </div>
      </template>

      <el-tabs :model-value="activeTab" @tab-change="handleTabChange" class="page-tabs">
        <el-tab-pane label="库存查询" name="stock" />
        <el-tab-pane label="材料入库" name="lot" />
      </el-tabs>

      <div class="section-title">待入库批次（登记后可稍后入库）</div>
      <div class="search-form">
        <el-input v-model="batchNoInput" placeholder="输入批次号并加载进度" class="search-input" clearable />
        <el-button @click="handleLoadBatchNo">加载批次</el-button>
        <el-button @click="loadPendingRegisterList">刷新列表</el-button>
      </div>

      <el-table :data="pendingRegisterList" stripe v-loading="pendingLoading">
        <el-table-column prop="batchNo" label="批次号" width="210" />
        <el-table-column prop="itemName" label="物料名称" width="160" />
        <el-table-column prop="totalQuantity" label="总数量" width="120" />
        <el-table-column prop="putAwayQuantity" label="已上架" width="120" />
        <el-table-column prop="pendingQuantity" label="待上架" width="120" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="createTime" label="登记时间" min-width="170" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="openPutAwayDialog(scope.row)">入库</el-button>
            <el-button link type="danger" size="small" @click="removePendingBatch(scope.row.batchNo)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="section-title section-gap">已入库明细</div>
      <div class="search-form">
        <el-select v-model="searchForm.itemId" placeholder="选择物料" clearable class="search-select">
          <el-option v-for="item in searchItemOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select
          v-model="searchForm.whId"
          placeholder="选择仓库"
          clearable
          class="search-select"
          @change="handleSearchWarehouseChange"
        >
          <el-option v-for="wh in warehouseList" :key="wh.whId" :label="wh.whName" :value="wh.whId" />
        </el-select>
        <el-select v-model="searchForm.locId" placeholder="选择库位" clearable class="search-select">
          <el-option v-for="loc in searchLocationOptions" :key="loc.locId" :label="loc.locCode" :value="loc.locId" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="batchNo" label="批次号" width="190" />
        <el-table-column prop="itemName" label="物料名称" width="160" />
        <el-table-column prop="supName" label="供应商" width="160">
          <template #default="scope">
            {{ scope.row.supName || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="whName" label="仓库" width="140" />
        <el-table-column prop="locCode" label="库位" width="120" />
        <el-table-column prop="currentQty" label="库存数量" width="120" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="productionDate" label="生产/进货日期" width="140">
          <template #default="scope">
            {{ scope.row.productionDate || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="expiryDate" label="有效期" width="120" />
        <el-table-column prop="updateTime" label="更新时间" min-width="170" />
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

    <el-dialog v-model="putAwayDialogVisible" title="批次入库上架" width="760px">
      <template v-if="currentPutAwayBatch">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          class="register-info"
          :title="`批次 ${currentPutAwayBatch.batchNo}，待上架 ${currentPutAwayBatch.pendingQuantity} ${currentPutAwayBatch.unit || ''}`"
        />
      </template>

      <el-form ref="putAwayFormRef" :model="putAwayForm" :rules="putAwayRules" inline class="putaway-form">
        <el-form-item label="目标仓库" prop="whId">
          <el-select v-model="putAwayForm.whId" placeholder="请选择仓库" @change="handlePutAwayWhChange">
            <el-option v-for="wh in warehouseList" :key="wh.whId" :label="wh.whName" :value="wh.whId" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标库位" prop="locId">
          <el-select v-model="putAwayForm.locId" placeholder="请选择库位">
            <el-option v-for="loc in putAwayLocationOptions" :key="loc.locId" :label="loc.locCode" :value="loc.locId" />
          </el-select>
        </el-form-item>
        <el-form-item label="上架数量" prop="quantity">
          <el-input-number v-model="putAwayForm.quantity" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAddPutAwayPlan">加入上架清单</el-button>
        </el-form-item>
      </el-form>

      <div class="plan-summary" v-if="currentPutAwayBatch">
        <span>总登记数量: {{ currentPutAwayBatch.totalQuantity }} {{ currentPutAwayBatch.unit || '' }}</span>
        <span>已上架: {{ currentPutAwayBatch.putAwayQuantity }} {{ currentPutAwayBatch.unit || '' }}</span>
        <span>待上架: {{ currentPutAwayBatch.pendingQuantity }} {{ currentPutAwayBatch.unit || '' }}</span>
        <span>本次计划上架: {{ plannedPutAwayQuantity }} {{ currentPutAwayBatch.unit || '' }}</span>
      </div>

      <el-table :data="putAwayPlanList" stripe size="small" style="width: 100%">
        <el-table-column prop="whName" label="目标仓库" min-width="140" />
        <el-table-column prop="locCode" label="目标库位" min-width="120" />
        <el-table-column prop="quantity" label="上架数量" width="120" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button link type="danger" size="small" @click="removePutAwayPlan(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="putAwayDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="putAwaySubmitting" @click="handleSubmitPutAwayPlan">提交上架清单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { getLocationList, type Location } from '@/api/location'
import { getMaterialList, type Material } from '@/api/material'
import {
  getMaterialLotList,
  getMaterialLotRegisterDetail,
  putAwayMaterialLot,
  type MaterialLot,
  type MaterialLotPutAwayForm,
  type MaterialLotRegisterInfo,
} from '@/api/materialLot'
import { getWarehouseAll, type Warehouse } from '@/api/warehouse'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const PENDING_BATCH_STORAGE_KEY = 'material-lot-pending-batches'

interface SelectOption {
  value: number
  label: string
}

interface PutAwayPlanItem {
  whId: string
  whName: string
  locId: string
  locCode: string
  quantity: number
}

const loading = ref(false)
const pendingLoading = ref(false)
const putAwaySubmitting = ref(false)

const putAwayFormRef = ref<FormInstance>()

const route = useRoute()
const router = useRouter()

const tableData = ref<MaterialLot[]>([])
const pendingRegisterList = ref<MaterialLotRegisterInfo[]>([])
const materialList = ref<Material[]>([])
const warehouseList = ref<Warehouse[]>([])
const searchLocationOptions = ref<Location[]>([])
const putAwayLocationOptions = ref<Location[]>([])

const batchNoInput = ref('')
const putAwayDialogVisible = ref(false)
const currentPutAwayBatch = ref<MaterialLotRegisterInfo | null>(null)
const putAwayPlanList = ref<PutAwayPlanItem[]>([])

const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })

const searchForm = reactive<{ itemId?: number; whId?: string; locId?: string }>({
  itemId: undefined,
  whId: undefined,
  locId: undefined,
})

const putAwayForm = reactive<MaterialLotPutAwayForm>({
  batchNo: '',
  whId: '',
  locId: '',
  quantity: 0,
})

const putAwayRules = {
  whId: [{ required: true, message: '目标仓库不能为空', trigger: 'change' }],
  locId: [{ required: true, message: '目标库位不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '上架数量不能为空', trigger: 'blur' }],
}

const searchItemOptions = computed<SelectOption[]>(() =>
  materialList.value.map((item) => ({ value: item.mid, label: item.mname })),
)

const activeTab = computed(() => (route.path.startsWith('/material/stock') ? 'stock' : 'lot'))

const plannedPutAwayQuantity = computed(() =>
  putAwayPlanList.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
)

const remainingPlannableQuantity = computed(() => {
  if (!currentPutAwayBatch.value) return 0
  return Number(currentPutAwayBatch.value.pendingQuantity || 0) - plannedPutAwayQuantity.value
})

const handleTabChange = (name: string | number) => {
  if (name === 'stock') {
    router.push('/material/stock')
    return
  }
  router.push('/material/lot')
}

const openRegisterPage = () => {
  router.push('/material/lot/register')
}

const readStoredBatchNos = (): string[] => {
  const raw = localStorage.getItem(PENDING_BATCH_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

const saveStoredBatchNos = (batchNos: string[]) => {
  localStorage.setItem(PENDING_BATCH_STORAGE_KEY, JSON.stringify([...new Set(batchNos)]))
}

const addPendingBatchNo = (batchNo: string) => {
  const list = readStoredBatchNos()
  if (!list.includes(batchNo)) {
    list.push(batchNo)
    saveStoredBatchNos(list)
  }
}

const removePendingBatch = (batchNo: string) => {
  const list = readStoredBatchNos().filter((item) => item !== batchNo)
  saveStoredBatchNos(list)
  pendingRegisterList.value = pendingRegisterList.value.filter((item) => item.batchNo !== batchNo)
}

const loadPendingRegisterList = async () => {
  pendingLoading.value = true
  try {
    const batchNos = readStoredBatchNos()
    const details = await Promise.all(
      batchNos.map(async (batchNo) => {
        try {
          const res = await getMaterialLotRegisterDetail(batchNo)
          return res.data
        } catch {
          return null
        }
      }),
    )

    const validList = details
      .filter((item): item is MaterialLotRegisterInfo => !!item)
      .filter((item) => Number(item.pendingQuantity || 0) > 0)

    pendingRegisterList.value = validList
    saveStoredBatchNos(validList.map((item) => item.batchNo))
  } finally {
    pendingLoading.value = false
  }
}

const handleLoadBatchNo = async () => {
  const batchNo = batchNoInput.value.trim()
  if (!batchNo) {
    ElMessage.warning('请输入批次号')
    return
  }

  try {
    const res = await getMaterialLotRegisterDetail(batchNo)
    if (Number(res.data.pendingQuantity || 0) <= 0) {
      ElMessage.info('该批次已完成入库')
      return
    }
    addPendingBatchNo(batchNo)
    await loadPendingRegisterList()
    batchNoInput.value = ''
    ElMessage.success('批次加载成功')
  } catch (error) {
    console.error('加载批次失败:', error)
  }
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getMaterialLotList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      itemId: searchForm.itemId,
      itemType: 1,
      whId: searchForm.whId,
      locId: searchForm.locId,
    })
    tableData.value = res.data.records || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('获取库存批次明细失败:', error)
  } finally {
    loading.value = false
  }
}

const loadSelectionData = async () => {
  try {
    const [materialRes, warehouseRes] = await Promise.all([getMaterialList({ pageSize: 1000 }), getWarehouseAll()])
    materialList.value = materialRes.data.records || []
    warehouseList.value = warehouseRes.data || []
  } catch (error) {
    console.error('加载下拉数据失败:', error)
  }
}

const loadLocationsByWarehouse = async (whId: string, target: 'search' | 'put-away') => {
  try {
    const res = await getLocationList({ whId, pageNum: 1, pageSize: 1000 })
    if (target === 'search') {
      searchLocationOptions.value = res.data.records || []
    } else {
      putAwayLocationOptions.value = res.data.records || []
    }
  } catch (error) {
    console.error('加载库位失败:', error)
    if (target === 'search') {
      searchLocationOptions.value = []
    } else {
      putAwayLocationOptions.value = []
    }
  }
}

const handleSearchWarehouseChange = async (value?: string) => {
  searchForm.locId = undefined
  if (!value) {
    searchLocationOptions.value = []
    return
  }
  await loadLocationsByWarehouse(value, 'search')
}

const handlePutAwayWhChange = async (value: string) => {
  putAwayForm.locId = ''
  if (!value) {
    putAwayLocationOptions.value = []
    return
  }
  await loadLocationsByWarehouse(value, 'put-away')
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}

const handleReset = () => {
  searchForm.itemId = undefined
  searchForm.whId = undefined
  searchForm.locId = undefined
  searchLocationOptions.value = []
  pagination.pageNum = 1
  getList()
}

const openPutAwayDialog = (batch: MaterialLotRegisterInfo) => {
  currentPutAwayBatch.value = batch
  putAwayForm.batchNo = batch.batchNo
  putAwayForm.whId = ''
  putAwayForm.locId = ''
  putAwayForm.quantity = 0
  putAwayLocationOptions.value = []
  putAwayPlanList.value = []
  putAwayDialogVisible.value = true
}

const handleAddPutAwayPlan = async () => {
  if (!currentPutAwayBatch.value || !putAwayFormRef.value) return

  await putAwayFormRef.value.validate((valid) => {
    if (!valid) return

    if (putAwayForm.quantity <= 0) {
      ElMessage.error('上架数量必须大于0')
      return
    }

    if (putAwayForm.quantity > remainingPlannableQuantity.value) {
      ElMessage.error(`上架数量超出可分配数量，当前可分配: ${remainingPlannableQuantity.value}`)
      return
    }

    const wh = warehouseList.value.find((item) => item.whId === putAwayForm.whId)
    const loc = putAwayLocationOptions.value.find((item) => item.locId === putAwayForm.locId)

    putAwayPlanList.value.push({
      whId: putAwayForm.whId,
      whName: wh?.whName || putAwayForm.whId,
      locId: putAwayForm.locId,
      locCode: loc?.locCode || putAwayForm.locId,
      quantity: putAwayForm.quantity,
    })

    putAwayForm.whId = ''
    putAwayForm.locId = ''
    putAwayForm.quantity = 0
    putAwayLocationOptions.value = []
  })
}

const removePutAwayPlan = (index: number) => {
  putAwayPlanList.value.splice(index, 1)
}

const handleSubmitPutAwayPlan = async () => {
  if (!currentPutAwayBatch.value) return

  if (putAwayPlanList.value.length === 0) {
    ElMessage.warning('请先添加至少一条上架计划')
    return
  }

  try {
    putAwaySubmitting.value = true
    for (const item of putAwayPlanList.value) {
      await putAwayMaterialLot({
        batchNo: currentPutAwayBatch.value.batchNo,
        whId: item.whId,
        locId: item.locId,
        quantity: item.quantity,
      })
    }

    const latest = await getMaterialLotRegisterDetail(currentPutAwayBatch.value.batchNo)
    currentPutAwayBatch.value = latest.data

    if (Number(latest.data.pendingQuantity || 0) <= 0) {
      removePendingBatch(latest.data.batchNo)
      putAwayDialogVisible.value = false
      ElMessage.success('上架完成，批次已全部入位')
    } else {
      ElMessage.success('上架成功，可继续上架剩余数量')
      addPendingBatchNo(latest.data.batchNo)
    }

    putAwayPlanList.value = []
    await loadPendingRegisterList()
    getList()
  } catch (error) {
    console.error('上架入位失败:', error)
  } finally {
    putAwaySubmitting.value = false
  }
}

onMounted(() => {
  const initialBatchNo = String(route.query.batchNo || '')
  if (initialBatchNo) {
    addPendingBatchNo(initialBatchNo)
  }

  getList()
  loadSelectionData()
  loadPendingRegisterList()
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

.page-tabs {
  margin-bottom: 12px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 12px;
}

.section-gap {
  margin-top: 18px;
}

.search-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-select {
  width: 180px;
}

.search-input {
  width: 260px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.register-info {
  margin-bottom: 14px;
}

.plan-summary {
  display: flex;
  gap: 16px;
  margin: 10px 0 12px;
  color: #606266;
  flex-wrap: wrap;
}

.putaway-form {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.putaway-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 12px;
}

.putaway-form :deep(.el-select) {
  width: 190px;
}

.putaway-form :deep(.el-input-number) {
  width: 190px;
}
</style>
