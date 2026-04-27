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
        <el-table-column prop="whId" label="仓库ID" min-width="160" />
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
        <el-table-column prop="currentQty" label="库存数量" width="120" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="productionDate" label="生产日期" width="140" />
        <el-table-column prop="expiryDate" label="有效期" width="120" />
        <el-table-column prop="updateTime" label="更新时间" min-width="170" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {
  getMaterialLotList,
  getMaterialStockSummary,
  type MaterialLot,
  type MaterialStockSummary,
} from '@/api/materialLot'
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

const pageTitle = computed(() => {
  if (itemName) return `${itemName} - 仓库分布`
  return `产成品 ${rawItemId} - 仓库分布`
})

const goBack = () => {
  router.push('/stock/product')
}

const loadSummary = async () => {
  summaryLoading.value = true
  try {
    const res = await getMaterialStockSummary({
      itemId: rawItemId,
      itemType: 2,
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
  detailVisible.value = true
  detailLoading.value = true
  detailTitle.value = `${itemName || row.itemName || ''} - ${row.whName || row.whId} 库位明细`
  try {
    const res = await getMaterialLotList({
      pageNum: 1,
      pageSize: 1000,
      itemId: rawItemId,
      itemType: 2,
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

onMounted(async () => {
  if (!rawItemId) {
    ElMessage.error('参数错误：缺少有效产品ID')
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
