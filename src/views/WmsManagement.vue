<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>仓库管理</span>
          <el-button type="primary" @click="openWarehouseDialog('add')">新增仓库</el-button>
        </div>
      </template>

      <div class="search-form">
        <el-input
          v-model="warehouseSearch.searchKey"
          placeholder="搜索仓库编码或名称"
          clearable
          class="search-input"
        />
        <el-select
          v-model="warehouseSearch.whType"
          placeholder="仓库类型"
          clearable
          class="search-select"
        >
          <el-option label="原料仓" :value="1" />
          <el-option label="成品仓" :value="2" />
          <el-option label="其他" :value="3" />
        </el-select>
        <el-button type="primary" @click="handleWarehouseSearch">搜索</el-button>
        <el-button @click="handleWarehouseReset">重置</el-button>
      </div>

      <el-table :data="warehouseTableData" stripe v-loading="warehouseLoading">
        <el-table-column prop="whCode" label="仓库编码" width="180" />
        <el-table-column prop="whName" label="仓库名称" min-width="200" />
        <el-table-column prop="whType" label="仓库类型" width="120">
          <template #default="scope">
            {{ getWarehouseTypeLabel(scope.row.whType) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleWarehouseEdit(scope.row)">
              编辑
            </el-button>
            <el-button
              link
              type="success"
              size="small"
              @click="handleManageWarehouseLocations(scope.row)"
            >
              库位管理
            </el-button>
            <el-button link type="danger" size="small" @click="handleWarehouseDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="warehousePagination.pageNum"
        v-model:page-size="warehousePagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="warehousePagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @change="getWarehouseListData"
      />
    </el-card>

    <el-dialog v-model="warehouseDialogVisible" :title="warehouseDialogTitle" width="420px">
      <el-form
        ref="warehouseFormRef"
        :model="warehouseFormData"
        :rules="warehouseRules"
        label-width="90px"
      >
        <el-form-item label="仓库名称" prop="whName">
          <el-input v-model="warehouseFormData.whName" />
        </el-form-item>
        <el-form-item label="仓库类型" prop="whType">
          <el-select v-model="warehouseFormData.whType" placeholder="请选择仓库类型">
            <el-option label="原料仓" :value="1" />
            <el-option label="成品仓" :value="2" />
            <el-option label="其他" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="warehouseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleWarehouseSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  addWarehouse,
  deleteWarehouse,
  getWarehouseList,
  updateWarehouse,
  type Warehouse,
  type WarehouseForm,
} from '@/api/warehouse'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const warehouseLoading = ref(false)
const warehouseTableData = ref<Warehouse[]>([])

const warehousePagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const warehouseSearch = reactive({
  searchKey: '',
  whType: undefined as number | undefined,
})

const warehouseDialogVisible = ref(false)
const warehouseDialogType = ref<'add' | 'edit'>('add')
const warehouseDialogTitle = ref('新增仓库')
const warehouseFormRef = ref<FormInstance>()
const warehouseFormData = reactive<WarehouseForm>({
  whName: '',
  whType: 1,
})

const warehouseRules = {
  whName: [{ required: true, message: '仓库名称不能为空', trigger: 'blur' }],
}

const getWarehouseTypeLabel = (value?: number) => {
  const map: Record<number, string> = {
    1: '原料仓',
    2: '成品仓',
    3: '其他',
  }
  return value !== undefined ? map[value] || '未知' : '未知'
}

const getWarehouseListData = async () => {
  warehouseLoading.value = true
  try {
    const res = await getWarehouseList({
      pageNum: warehousePagination.pageNum,
      pageSize: warehousePagination.pageSize,
      searchKey: warehouseSearch.searchKey,
      whType: warehouseSearch.whType,
    })
    warehouseTableData.value = res.data.records || []
    warehousePagination.total = res.data.total || 0
  } catch (error) {
    console.error('获取仓库列表失败:', error)
  } finally {
    warehouseLoading.value = false
  }
}

const handleWarehouseSearch = () => {
  warehousePagination.pageNum = 1
  getWarehouseListData()
}

const handleWarehouseReset = () => {
  warehouseSearch.searchKey = ''
  warehouseSearch.whType = undefined
  warehousePagination.pageNum = 1
  getWarehouseListData()
}

const openWarehouseDialog = (type: 'add' | 'edit') => {
  warehouseDialogType.value = type
  warehouseDialogTitle.value = type === 'add' ? '新增仓库' : '编辑仓库'
  warehouseDialogVisible.value = true

  if (type === 'add') {
    warehouseFormData.whId = undefined
    warehouseFormData.whName = ''
    warehouseFormData.whType = 1
  }
}

const handleWarehouseEdit = (row: Warehouse) => {
  warehouseDialogType.value = 'edit'
  warehouseDialogTitle.value = '编辑仓库'
  warehouseDialogVisible.value = true

  warehouseFormData.whId = row.whId
  warehouseFormData.whName = row.whName
  warehouseFormData.whType = row.whType
}

const handleWarehouseSubmit = async () => {
  if (!warehouseFormRef.value) return

  await warehouseFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (warehouseDialogType.value === 'add') {
        await addWarehouse(warehouseFormData)
        ElMessage.success('新增仓库成功')
      } else {
        await updateWarehouse(warehouseFormData.whId!, warehouseFormData)
        ElMessage.success('修改仓库成功')
      }

      warehouseDialogVisible.value = false
      await getWarehouseListData()
    } catch (error) {
      console.error('仓库保存失败:', error)
    }
  })
}

const handleWarehouseDelete = (row: Warehouse) => {
  ElMessageBox.confirm(`确定删除仓库 "${row.whName}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteWarehouse(row.whId)
        ElMessage.success('删除仓库成功')
        await getWarehouseListData()
      } catch (error) {
        console.error('删除仓库失败:', error)
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const handleManageWarehouseLocations = (row: Warehouse) => {
  router.push({
    name: 'WarehouseLocationManagement',
    params: { whId: row.whId },
    query: { whCode: row.whCode, whName: row.whName },
  })
}

onMounted(async () => {
  await getWarehouseListData()
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
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.search-input {
  width: 220px;
}

.search-select {
  width: 160px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
