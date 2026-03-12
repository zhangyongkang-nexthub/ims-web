<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>库存查询</span>
        </div>
      </template>

      <div class="search-form">
        <el-select v-model="searchForm.mId" placeholder="选择物料" clearable class="search-select">
          <el-option v-for="m in materialList" :key="m.mid" :label="m.mname" :value="m.mid" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="materialId" label="物料ID" width="100" />
        <el-table-column prop="materialName" label="物料名称" width="180" />
        <el-table-column prop="totalQuantity" label="库存数量" width="140" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="minThreshold" label="最小阈值" width="120" />
        <el-table-column prop="lastPurchaseDate" label="最近采购时间" width="180" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { getMaterialList, type Material } from '@/api/material'
import { getMaterialStockList, type MaterialStock } from '@/api/materialStock'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const tableData = ref<MaterialStock[]>([])
const materialList = ref<Material[]>([])

const searchForm = reactive<{ mId?: number }>({
  mId: undefined,
})

const getList = async () => {
  loading.value = true
  try {
    const res = await getMaterialStockList({ mId: searchForm.mId })
    tableData.value = res.data
  } catch (error) {
    console.error('获取库存列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadMaterialList = async () => {
  try {
    const res = await getMaterialList({ pageSize: 1000 })
    materialList.value = res.data.records
  } catch (error) {
    console.error('加载物料列表失败:', error)
  }
}

const handleSearch = () => {
  getList()
}

const handleReset = () => {
  searchForm.mId = undefined
  getList()
}

onMounted(() => {
  getList()
  loadMaterialList()
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

.search-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-select {
  width: 220px;
}
</style>
