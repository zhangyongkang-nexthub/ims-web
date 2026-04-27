<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ pageTitle }}</span>
          <el-button @click="goBack">返回库存查询</el-button>
        </div>
      </template>

      <el-table :data="summaryData" stripe v-loading="summaryLoading" style="width: 100%">
        <el-table-column prop="whId" label="仓库ID" min-width="180" />
        <el-table-column prop="whName" label="仓库名称" min-width="180" />
        <el-table-column prop="totalQty" label="库存数量" width="140" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleViewWarehouseDetail(scope.row)"
            >
              库位明细
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="detailVisible" class="box-card" v-loading="detailLoading">
      <template #header>
        <div class="card-header">
          <span>{{ detailTitle }}</span>
        </div>
      </template>

      <el-empty
        v-if="!detailLoading && detailData.length === 0"
        description="请选择仓库查看库位明细"
      />

      <el-table v-else :data="detailData" stripe style="width: 100%">
        <el-table-column prop="locCode" label="库位" width="120" />
        <el-table-column prop="batchNo" label="批次号" width="170" />
        <el-table-column prop="supName" label="供应商" width="160">
          <template #default="scope">
            {{ scope.row.supName || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="currentQty" label="库存数量" width="120" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="productionDate" label="生产/进货日期" width="140" />
        <el-table-column prop="expiryDate" label="有效期" width="120" />
        <el-table-column prop="updateTime" label="更新时间" min-width="170" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="openTransferDialog(scope.row)">
              移库
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="transferDialogVisible" title="库存移库" width="520px">
      <el-form
        ref="transferFormRef"
        :model="transferForm"
        :rules="transferRules"
        label-width="110px"
      >
        <el-form-item label="源仓库">
          <el-input :value="transferSourceWhText" disabled />
        </el-form-item>
        <el-form-item label="源库位">
          <el-input :value="transferSourceLocText" disabled />
        </el-form-item>
        <el-form-item label="源可用数量">
          <el-input :value="transferSourceQtyText" disabled />
        </el-form-item>
        <el-form-item label="目标仓库" prop="targetWhId">
          <el-select
            v-model="transferForm.targetWhId"
            placeholder="请选择目标仓库"
            @change="handleTransferTargetWhChange"
          >
            <el-option
              v-for="wh in transferWarehouseList"
              :key="wh.whId"
              :label="wh.whName"
              :value="wh.whId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标库位" prop="targetLocId">
          <el-select v-model="transferForm.targetLocId" placeholder="请选择目标库位">
            <el-option
              v-for="loc in transferLocationList"
              :key="loc.locId"
              :label="loc.locCode"
              :value="loc.locId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="移库数量" prop="transferQty">
          <el-input-number v-model="transferForm.transferQty" :min="0" :precision="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="transferSubmitting" @click="handleTransferSubmit"
          >确定</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { getLocationList, type Location } from '@/api/location'
import {
  getMaterialLotList,
  getMaterialStockSummary,
  transferMaterialLot,
  type MaterialLot,
  type MaterialLotTransferForm,
  type MaterialStockSummary,
} from '@/api/materialLot'
import { getWarehouseAll, type Warehouse } from '@/api/warehouse'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const rawItemId = String(route.params.itemId || '')
const itemName = String(route.query.itemName || '')

const summaryLoading = ref(false)
const summaryData = ref<MaterialStockSummary[]>([])
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<MaterialLot[]>([])
const detailTitle = ref('库位明细')
const currentDetailWhId = ref('')
const transferDialogVisible = ref(false)
const transferSubmitting = ref(false)
const transferFormRef = ref<FormInstance>()
const transferSourceRow = ref<MaterialLot | null>(null)
const transferWarehouseList = ref<Warehouse[]>([])
const transferLocationList = ref<Location[]>([])
const transferForm = ref<MaterialLotTransferForm>({
  lotStockId: '',
  targetWhId: '',
  targetLocId: '',
  transferQty: 0,
})

const transferRules = {
  targetWhId: [{ required: true, message: '目标仓库不能为空', trigger: 'change' }],
  targetLocId: [{ required: true, message: '目标库位不能为空', trigger: 'change' }],
  transferQty: [{ required: true, message: '移库数量不能为空', trigger: 'blur' }],
}

const pageTitle = computed(() => {
  if (itemName) return `${itemName} - 仓库分布`
  return `物料 ${rawItemId} - 仓库分布`
})

const transferSourceWhText = computed(() => {
  if (!transferSourceRow.value) return ''
  return transferSourceRow.value.whName || transferSourceRow.value.whId
})

const transferSourceLocText = computed(() => transferSourceRow.value?.locCode || '')

const transferSourceQtyText = computed(() => {
  if (!transferSourceRow.value) return ''
  const qty = transferSourceRow.value.currentQty
  const unit = transferSourceRow.value.unit || ''
  return unit ? `${qty} ${unit}` : String(qty)
})

const goBack = () => {
  router.push('/material/stock')
}

const loadSummary = async () => {
  summaryLoading.value = true
  try {
    const res = await getMaterialStockSummary({
      itemId: rawItemId,
      itemType: 1,
    })
    summaryData.value = res.data
  } catch (error) {
    summaryData.value = []
    ElMessage.error('加载仓库分布失败')
    console.error('加载仓库分布失败:', error)
  } finally {
    summaryLoading.value = false
  }
}

const handleViewWarehouseDetail = async (row: MaterialStockSummary) => {
  currentDetailWhId.value = row.whId
  detailVisible.value = true
  detailLoading.value = true
  detailTitle.value = `${itemName || row.itemName || ''} - ${row.whName || row.whId} 库位明细`
  try {
    const res = await getMaterialLotList({
      pageNum: 1,
      pageSize: 1000,
      itemId: rawItemId,
      itemType: 1,
      whId: row.whId,
    })
    detailData.value = res.data.records
  } catch (error) {
    detailData.value = []
    ElMessage.error('加载库位明细失败')
    console.error('加载库位明细失败:', error)
  } finally {
    detailLoading.value = false
  }
}

const loadTransferWarehouseList = async () => {
  try {
    const res = await getWarehouseAll()
    transferWarehouseList.value = res.data || []
  } catch (error) {
    transferWarehouseList.value = []
    console.error('加载仓库列表失败:', error)
  }
}

const loadTransferLocationList = async (whId: string) => {
  try {
    const res = await getLocationList({ whId, pageNum: 1, pageSize: 1000 })
    transferLocationList.value = res.data.records || []
  } catch (error) {
    transferLocationList.value = []
    console.error('加载库位列表失败:', error)
  }
}

const handleTransferTargetWhChange = async (whId: string) => {
  transferForm.value.targetLocId = ''
  if (!whId) {
    transferLocationList.value = []
    return
  }
  await loadTransferLocationList(whId)
}

const openTransferDialog = async (row: MaterialLot) => {
  transferSourceRow.value = row
  transferForm.value = {
    lotStockId: row.lotStockId,
    targetWhId: '',
    targetLocId: '',
    transferQty: 0,
  }
  transferLocationList.value = []
  transferDialogVisible.value = true
  await loadTransferWarehouseList()
}

const handleTransferSubmit = async () => {
  if (!transferFormRef.value || !transferSourceRow.value) return

  await transferFormRef.value.validate(async (valid) => {
    if (!valid) return

    if (transferForm.value.transferQty <= 0) {
      ElMessage.error('移库数量必须大于0')
      return
    }
    if (transferForm.value.transferQty > transferSourceRow.value!.currentQty) {
      ElMessage.error('移库数量不能大于源可用数量')
      return
    }

    transferSubmitting.value = true
    try {
      await transferMaterialLot(transferForm.value)
      ElMessage.success('移库成功')
      transferDialogVisible.value = false

      await loadSummary()
      if (currentDetailWhId.value) {
        const currentWh = summaryData.value.find((item) => item.whId === currentDetailWhId.value)
        if (currentWh) {
          await handleViewWarehouseDetail(currentWh)
        } else {
          detailData.value = []
          detailVisible.value = false
        }
      }
    } catch (error) {
      console.error('移库失败:', error)
    } finally {
      transferSubmitting.value = false
    }
  })
}

onMounted(async () => {
  if (!rawItemId) {
    ElMessage.error('参数错误：缺少有效物料ID')
    goBack()
    return
  }

  await loadSummary()
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
