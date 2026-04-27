<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>产成品库存管理</span>
          <div class="actions">
            <span class="tips">工单完工后自动生成待入库记录，手动执行上架入位</span>
            <el-button type="warning" @click="openShipDialog">产品出库</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="库存查询" name="stock">
          <div class="search-form">
            <el-select v-model="stockSearch.pId" placeholder="选择产品" clearable class="search-select">
              <el-option v-for="p in productList" :key="p.pid" :label="p.pname" :value="p.pid" />
            </el-select>
            <el-button type="primary" @click="handleStockSearch">查询</el-button>
            <el-button @click="handleStockReset">重置</el-button>
          </div>

          <el-table :data="stockTableData" stripe v-loading="stockLoading">
            <el-table-column prop="pCode" label="产品编码" width="150" />
            <el-table-column prop="pName" label="产品名称" width="180" />
            <el-table-column prop="quantity" label="库存数量" width="120" />
            <el-table-column prop="unit" label="单位" width="100" />
            <el-table-column prop="lastStockInTime" label="最近入库时间" width="180" />
            <el-table-column prop="lastStockOutTime" label="最近出库时间" width="180" />
            <el-table-column prop="updateTime" label="更新时间" min-width="180" />
          </el-table>

          <el-pagination
            v-model:current-page="stockPagination.pageNum"
            v-model:page-size="stockPagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="stockPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @change="loadStockList"
          />
        </el-tab-pane>

        <el-tab-pane label="产品入库" name="pending">
          <div class="search-form">
            <el-select v-model="pendingSearch.pId" placeholder="选择产品" clearable class="search-select">
              <el-option v-for="p in productList" :key="p.pid" :label="p.pname" :value="p.pid" />
            </el-select>
            <el-select v-model="pendingSearch.state" placeholder="入库状态" clearable class="search-select">
              <el-option v-for="item in pendingStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button type="primary" @click="handlePendingSearch">查询</el-button>
            <el-button @click="handlePendingReset">重置</el-button>
          </div>

          <el-table :data="pendingTableData" stripe v-loading="pendingLoading">
            <el-table-column prop="receiveNo" label="入库编号" width="210" />
            <el-table-column prop="receiveId" label="入库记录ID" width="180" />
            <el-table-column prop="pName" label="产品名称" width="180" />
            <el-table-column prop="batchNo" label="批次号" width="160" />
            <el-table-column prop="quantity" label="总数量" width="120" />
            <el-table-column prop="putAwayQty" label="已入库" width="120" />
            <el-table-column prop="pendingQty" label="待入库" width="120" />
            <el-table-column prop="uom" label="单位" width="100" />
            <el-table-column prop="stateLabel" label="状态" width="120" />
            <el-table-column prop="createTime" label="生成时间" min-width="180" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  size="small"
                  :disabled="scope.row.state === 1 || Number(scope.row.pendingQty || 0) <= 0"
                  @click="openPutAwayDialog(scope.row)"
                >
                  入库
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="pendingPagination.pageNum"
            v-model:page-size="pendingPagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pendingPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @change="loadPendingList"
          />
        </el-tab-pane>

        <el-tab-pane label="出库记录" name="ship">
          <div class="search-form">
            <el-input v-model="shipSearch.batchNo" placeholder="批次号" clearable class="search-input" />
            <el-input v-model="shipSearch.customerName" placeholder="客户名称" clearable class="search-input" />
            <el-button type="primary" @click="handleShipSearch">查询</el-button>
            <el-button @click="handleShipReset">重置</el-button>
          </div>

          <el-table :data="shipTableData" stripe v-loading="shipLoading">
            <el-table-column prop="shipNo" label="出库单号" width="210" />
            <el-table-column prop="batchNo" label="批次号" width="160" />
            <el-table-column prop="customerName" label="客户名称" width="180" />
            <el-table-column prop="quantity" label="数量" width="120" />
            <el-table-column prop="operatorId" label="操作员" width="100" />
            <el-table-column prop="shipTime" label="出库时间" min-width="180" />
          </el-table>

          <el-pagination
            v-model:current-page="shipPagination.pageNum"
            v-model:page-size="shipPagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="shipPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @change="loadShipRecords"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="putAwayDialogVisible" title="待入库产品上架" width="760px">
      <template v-if="currentPending">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          class="pending-info"
          :title="`入库编号 ${currentPending.receiveNo || ''}，待入库 ${currentPending.pendingQty} ${currentPending.uom || ''}`"
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
            <el-option v-for="loc in putAwayLocationList" :key="loc.locId" :label="loc.locCode" :value="loc.locId" />
          </el-select>
        </el-form-item>
        <el-form-item label="上架数量" prop="quantity">
          <el-input-number v-model="putAwayForm.quantity" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAddPutAwayPlan">加入上架清单</el-button>
        </el-form-item>
      </el-form>

      <div class="plan-summary" v-if="currentPending">
        <span>总数量: {{ currentPending.quantity }} {{ currentPending.uom || '' }}</span>
        <span>已入库: {{ currentPending.putAwayQty }} {{ currentPending.uom || '' }}</span>
        <span>待入库: {{ currentPending.pendingQty }} {{ currentPending.uom || '' }}</span>
        <span>本次计划入库: {{ plannedPutAwayQuantity }} {{ currentPending.uom || '' }}</span>
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

    <el-dialog v-model="shipDialogVisible" title="产品出库" width="500px">
      <el-form ref="shipFormRef" :model="shipForm" :rules="shipRules" label-width="100px">
        <el-form-item label="产品" prop="pId">
          <el-select v-model="shipForm.pId" placeholder="请选择产品">
            <el-option v-for="p in productList" :key="p.pid" :label="p.pname" :value="p.pid" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="shipForm.quantity" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="客户名称" prop="customerName">
          <el-select v-model="shipForm.customerName" placeholder="请选择客户" clearable filterable>
            <el-option
              v-for="c in customerList"
              :key="c.custId"
              :label="c.custName"
              :value="c.custName"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipSubmitting" @click="handleShipSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { getCustomerList, type Customer } from '@/api/customer'
import { getLocationList, type Location } from '@/api/location'
import { getProductList, type Product } from '@/api/product'
import {
  getProductPendingDetail,
  getProductPendingList,
  getProductShipRecordList,
  getProductStockList,
  putAwayProductPending,
  shipProductStock,
  type ProductPending,
  type ProductPendingPutAwayForm,
  type ProductShipForm,
  type ProductShipRecord,
  type ProductStock,
} from '@/api/productStock'
import { getWarehouseAll, type Warehouse } from '@/api/warehouse'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

const activeTab = ref<'stock' | 'pending' | 'ship'>('stock')
const productList = ref<Product[]>([])
const customerList = ref<Customer[]>([])
const warehouseList = ref<Warehouse[]>([])

const stockLoading = ref(false)
const stockTableData = ref<ProductStock[]>([])
const stockSearch = reactive<{ pId?: number }>({ pId: undefined })
const stockPagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })

const pendingLoading = ref(false)
const pendingTableData = ref<ProductPending[]>([])
const pendingSearch = reactive<{ pId?: number; state?: number }>({ pId: undefined, state: undefined })
const pendingPagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })

const shipLoading = ref(false)
const shipTableData = ref<ProductShipRecord[]>([])
const shipSearch = reactive<{ batchNo: string; customerName: string }>({ batchNo: '', customerName: '' })
const shipPagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })

const pendingStatusOptions = [
  { label: '待入库', value: 0 },
  { label: '已入库', value: 1 },
]

interface PutAwayPlanItem {
  whId: string
  whName: string
  locId: string
  locCode: string
  quantity: number
}

const putAwayDialogVisible = ref(false)
const putAwaySubmitting = ref(false)
const putAwayFormRef = ref<FormInstance>()
const putAwayLocationList = ref<Location[]>([])
const currentPending = ref<ProductPending | null>(null)
const putAwayPlanList = ref<PutAwayPlanItem[]>([])
const putAwayForm = reactive<ProductPendingPutAwayForm>({
  receiveId: '',
  whId: '',
  locId: '',
  quantity: 0,
})

const shipDialogVisible = ref(false)
const shipSubmitting = ref(false)
const shipFormRef = ref<FormInstance>()
const shipForm = reactive<ProductShipForm>({
  pId: 0,
  quantity: 0,
  customerName: '',
})

const putAwayRules = {
  whId: [{ required: true, message: '目标仓库不能为空', trigger: 'change' }],
  locId: [{ required: true, message: '目标库位不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }],
}

const shipRules = {
  pId: [{ required: true, message: '产品不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }],
}

const plannedPutAwayQuantity = computed(() =>
  putAwayPlanList.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
)

const remainingPlannableQuantity = computed(() => {
  if (!currentPending.value) return 0
  return Number(currentPending.value.pendingQty || 0) - plannedPutAwayQuantity.value
})

const loadProducts = async () => {
  try {
    const res = await getProductList({ pageSize: 1000 })
    productList.value = res.data.records || []
  } catch (error) {
    console.error('加载产品列表失败:', error)
  }
}

const loadCustomers = async () => {
  try {
    const res = await getCustomerList({ pageSize: 1000 })
    customerList.value = res.data.records || []
  } catch (error) {
    console.error('加载客户列表失败:', error)
  }
}

const loadWarehouses = async () => {
  try {
    const res = await getWarehouseAll()
    warehouseList.value = res.data || []
  } catch (error) {
    console.error('加载仓库列表失败:', error)
  }
}

const loadStockList = async () => {
  stockLoading.value = true
  try {
    const res = await getProductStockList({
      pageNum: stockPagination.pageNum,
      pageSize: stockPagination.pageSize,
      pId: stockSearch.pId,
    })
    stockTableData.value = res.data.records || []
    stockPagination.total = res.data.total || 0
  } catch (error) {
    console.error('获取产成品库存失败:', error)
  } finally {
    stockLoading.value = false
  }
}

const loadPendingList = async () => {
  pendingLoading.value = true
  try {
    const res = await getProductPendingList({
      pageNum: pendingPagination.pageNum,
      pageSize: pendingPagination.pageSize,
      pId: pendingSearch.pId,
      state: pendingSearch.state,
    })
    pendingTableData.value = res.data.records || []
    pendingPagination.total = res.data.total || 0
  } catch (error) {
    console.error('获取待入库列表失败:', error)
  } finally {
    pendingLoading.value = false
  }
}

const loadShipRecords = async () => {
  shipLoading.value = true
  try {
    const res = await getProductShipRecordList({
      pageNum: shipPagination.pageNum,
      pageSize: shipPagination.pageSize,
      batchNo: shipSearch.batchNo,
      customerName: shipSearch.customerName,
    })
    shipTableData.value = res.data.records || []
    shipPagination.total = res.data.total || 0
  } catch (error) {
    console.error('获取出库记录失败:', error)
  } finally {
    shipLoading.value = false
  }
}

const handleTabChange = (name: string | number) => {
  if (name === 'stock') loadStockList()
  if (name === 'pending') loadPendingList()
  if (name === 'ship') loadShipRecords()
}

const handleStockSearch = () => {
  stockPagination.pageNum = 1
  loadStockList()
}

const handleStockReset = () => {
  stockSearch.pId = undefined
  stockPagination.pageNum = 1
  loadStockList()
}

const handlePendingSearch = () => {
  pendingPagination.pageNum = 1
  loadPendingList()
}

const handlePendingReset = () => {
  pendingSearch.pId = undefined
  pendingSearch.state = undefined
  pendingPagination.pageNum = 1
  loadPendingList()
}

const handleShipSearch = () => {
  shipPagination.pageNum = 1
  loadShipRecords()
}

const handleShipReset = () => {
  shipSearch.batchNo = ''
  shipSearch.customerName = ''
  shipPagination.pageNum = 1
  loadShipRecords()
}

const handlePutAwayWhChange = async (whId?: string) => {
  putAwayForm.locId = ''
  if (!whId) {
    putAwayLocationList.value = []
    return
  }
  try {
    const res = await getLocationList({ whId, pageNum: 1, pageSize: 1000 })
    putAwayLocationList.value = res.data.records || []
  } catch (error) {
    putAwayLocationList.value = []
    console.error('加载仓库库位失败:', error)
  }
}

const openPutAwayDialog = async (row: ProductPending) => {
  try {
    const res = await getProductPendingDetail(row.receiveId)
    currentPending.value = res.data
    putAwayForm.receiveId = row.receiveId
    putAwayForm.whId = ''
    putAwayForm.locId = ''
    putAwayForm.quantity = 0
    putAwayLocationList.value = []
    putAwayPlanList.value = []
    putAwayDialogVisible.value = true
  } catch (error) {
    console.error('加载待入库详情失败:', error)
  }
}

const openShipDialog = () => {
  shipDialogVisible.value = true
  shipForm.pId = 0
  shipForm.quantity = 0
  shipForm.customerName = ''
}

const handleAddPutAwayPlan = async () => {
  if (!currentPending.value || !putAwayFormRef.value) return

  await putAwayFormRef.value.validate((valid) => {
    if (!valid) return

    if (putAwayForm.quantity <= 0) {
      ElMessage.error('入库数量必须大于0')
      return
    }

    if (putAwayForm.quantity > remainingPlannableQuantity.value) {
      ElMessage.error(`入库数量超出可分配数量，当前可分配: ${remainingPlannableQuantity.value}`)
      return
    }

    const wh = warehouseList.value.find((item) => item.whId === putAwayForm.whId)
    const loc = putAwayLocationList.value.find((item) => item.locId === putAwayForm.locId)

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
    putAwayLocationList.value = []
  })
}

const removePutAwayPlan = (index: number) => {
  putAwayPlanList.value.splice(index, 1)
}

const handleSubmitPutAwayPlan = async () => {
  if (!currentPending.value) return

  if (putAwayPlanList.value.length === 0) {
    ElMessage.warning('请先添加至少一条上架计划')
    return
  }

  try {
    putAwaySubmitting.value = true
    for (const item of putAwayPlanList.value) {
      await putAwayProductPending({
        receiveId: currentPending.value.receiveId,
        whId: item.whId,
        locId: item.locId,
        quantity: item.quantity,
      })
    }

    const latest = await getProductPendingDetail(currentPending.value.receiveId)
    currentPending.value = latest.data

    if (Number(latest.data.pendingQty || 0) <= 0) {
      putAwayDialogVisible.value = false
      ElMessage.success('产品已全部入库完成')
    } else {
      ElMessage.success('上架成功，可继续入库剩余数量')
    }

    putAwayPlanList.value = []
    await loadPendingList()
    loadStockList()
  } catch (error) {
    console.error('产品上架入库失败:', error)
  } finally {
    putAwaySubmitting.value = false
  }
}

const handleShipSubmit = async () => {
  if (!shipFormRef.value) return

  await shipFormRef.value.validate(async (valid) => {
    if (!valid) return

    if (shipForm.quantity <= 0) {
      ElMessage.error('出库数量必须大于0')
      return
    }

    try {
      shipSubmitting.value = true
      await shipProductStock({
        pId: shipForm.pId,
        quantity: shipForm.quantity,
        customerName: shipForm.customerName || undefined,
      })
      ElMessage.success('产品出库成功')
      shipDialogVisible.value = false
      loadStockList()
      if (activeTab.value === 'ship') {
        loadShipRecords()
      }
    } catch (error) {
      console.error('产品出库失败:', error)
    } finally {
      shipSubmitting.value = false
    }
  })
}

onMounted(() => {
  loadProducts()
  loadCustomers()
  loadWarehouses()
  loadStockList()
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

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.tips {
  color: #909399;
  font-size: 13px;
}

.search-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-select {
  width: 220px;
}

.search-input {
  width: 220px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.pending-info {
  margin-bottom: 14px;
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

.plan-summary {
  display: flex;
  gap: 16px;
  margin: 10px 0 12px;
  color: #606266;
  flex-wrap: wrap;
}
</style>
