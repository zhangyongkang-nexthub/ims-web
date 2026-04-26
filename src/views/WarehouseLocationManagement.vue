<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>
            库位管理
            <span class="warehouse-tip">{{ warehouseTitle }}</span>
          </span>
          <el-button @click="goBack">返回仓库管理</el-button>
        </div>
      </template>

      <div class="toolbar">
        <div class="search-form">
          <el-input
            v-model="locationSearch.searchKey"
            placeholder="搜索库位编码"
            clearable
            class="search-input"
          />
          <el-select
            v-model="locationSearch.locType"
            placeholder="库位类型"
            clearable
            class="search-select"
          >
            <el-option label="常温" :value="1" />
            <el-option label="冷藏" :value="2" />
            <el-option label="危险品" :value="3" />
          </el-select>
          <el-select
            v-model="locationSearch.isActive"
            placeholder="可用状态"
            clearable
            class="search-select"
          >
            <el-option label="可用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
          <el-select
            v-model="locationSearch.status"
            placeholder="占用状态"
            clearable
            class="search-select"
          >
            <el-option label="空闲" :value="0" />
            <el-option label="占用" :value="1" />
            <el-option label="满载" :value="2" />
          </el-select>
          <el-button type="primary" @click="handleLocationSearch">搜索</el-button>
          <el-button @click="handleLocationReset">重置</el-button>
        </div>
        <el-button type="primary" @click="openLocationDialog('add')">新增库位</el-button>
      </div>

      <el-table :data="locationTableData" stripe v-loading="locationLoading">
        <el-table-column prop="locCode" label="库位编码" width="160" />
        <el-table-column prop="locType" label="库位类型" width="120">
          <template #default="scope">
            {{ getLocationTypeLabel(scope.row.locType) }}
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="可用状态" width="100">
          <template #default="scope">
            {{ scope.row.isActive === 1 ? '可用' : '禁用' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="占用状态" width="100">
          <template #default="scope">
            {{ getLocationStatusLabel(scope.row.status) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleLocationEdit(scope.row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleLocationDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="locationPagination.pageNum"
        v-model:page-size="locationPagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="locationPagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @change="getLocationListData"
      />
    </el-card>

    <el-dialog v-model="locationDialogVisible" :title="locationDialogTitle" width="520px">
      <el-form
        ref="locationFormRef"
        :model="locationFormData"
        :rules="locationRules"
        label-width="95px"
      >
        <el-form-item label="所属仓库">
          <el-input :value="warehouseTitle" disabled />
        </el-form-item>
        <el-form-item label="库位编码" prop="locCode">
          <el-input v-model="locationFormData.locCode" placeholder="例如 A-01-05" />
        </el-form-item>
        <el-form-item label="库位类型" prop="locType">
          <el-select v-model="locationFormData.locType" placeholder="请选择库位类型">
            <el-option label="常温" :value="1" />
            <el-option label="冷藏" :value="2" />
            <el-option label="危险品" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="可用状态" prop="isActive">
          <el-select v-model="locationFormData.isActive">
            <el-option label="可用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="占用状态" prop="status">
          <el-select v-model="locationFormData.status">
            <el-option label="空闲" :value="0" />
            <el-option label="占用" :value="1" />
            <el-option label="满载" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="locationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleLocationSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  addLocation,
  deleteLocation,
  getLocationList,
  updateLocation,
  type Location,
  type LocationForm,
} from '@/api/location'
import { getWarehouseDetail } from '@/api/warehouse'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const whId = String(route.params.whId || '')

const warehouseInfo = ref<{ whCode?: string; whName?: string }>({
  whCode: (route.query.whCode as string) || '',
  whName: (route.query.whName as string) || '',
})

const warehouseTitle = computed(() => {
  const code = warehouseInfo.value.whCode || ''
  const name = warehouseInfo.value.whName || ''
  return code || name ? `${code} - ${name}` : `仓库ID: ${whId}`
})

const locationLoading = ref(false)
const locationTableData = ref<Location[]>([])

const locationPagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const locationSearch = reactive({
  searchKey: '',
  locType: undefined as number | undefined,
  isActive: undefined as number | undefined,
  status: undefined as number | undefined,
})

const locationDialogVisible = ref(false)
const locationDialogType = ref<'add' | 'edit'>('add')
const locationDialogTitle = ref('新增库位')
const locationFormRef = ref<FormInstance>()
const locationFormData = reactive<LocationForm>({
  whId,
  locCode: '',
  locType: 1,
  isActive: 1,
  status: 0,
})

const locationRules = {
  locCode: [{ required: true, message: '库位编码不能为空', trigger: 'blur' }],
}

const getLocationTypeLabel = (value?: number) => {
  const map: Record<number, string> = {
    1: '常温',
    2: '冷藏',
    3: '危险品',
  }
  return value !== undefined ? map[value] || '未知' : '未知'
}

const getLocationStatusLabel = (value?: number) => {
  const map: Record<number, string> = {
    0: '空闲',
    1: '占用',
    2: '满载',
  }
  return value !== undefined ? map[value] || '未知' : '未知'
}

const loadWarehouseInfo = async () => {
  try {
    const res = await getWarehouseDetail(whId)
    warehouseInfo.value = {
      whCode: res.data.whCode,
      whName: res.data.whName,
    }
  } catch (error) {
    console.error('获取仓库详情失败:', error)
  }
}

const getLocationListData = async () => {
  locationLoading.value = true
  try {
    const res = await getLocationList({
      pageNum: locationPagination.pageNum,
      pageSize: locationPagination.pageSize,
      whId,
      searchKey: locationSearch.searchKey,
      locType: locationSearch.locType,
      isActive: locationSearch.isActive,
      status: locationSearch.status,
    })
    locationTableData.value = res.data.records || []
    locationPagination.total = res.data.total || 0
  } catch (error) {
    console.error('获取库位列表失败:', error)
  } finally {
    locationLoading.value = false
  }
}

const handleLocationSearch = () => {
  locationPagination.pageNum = 1
  getLocationListData()
}

const handleLocationReset = () => {
  locationSearch.searchKey = ''
  locationSearch.locType = undefined
  locationSearch.isActive = undefined
  locationSearch.status = undefined
  locationPagination.pageNum = 1
  getLocationListData()
}

const openLocationDialog = (type: 'add' | 'edit') => {
  locationDialogType.value = type
  locationDialogTitle.value = type === 'add' ? '新增库位' : '编辑库位'
  locationDialogVisible.value = true

  if (type === 'add') {
    locationFormData.locId = undefined
    locationFormData.whId = whId
    locationFormData.locCode = ''
    locationFormData.locType = 1
    locationFormData.isActive = 1
    locationFormData.status = 0
  }
}

const handleLocationEdit = (row: Location) => {
  locationDialogType.value = 'edit'
  locationDialogTitle.value = '编辑库位'
  locationDialogVisible.value = true

  locationFormData.locId = row.locId
  locationFormData.whId = row.whId
  locationFormData.locCode = row.locCode
  locationFormData.locType = row.locType
  locationFormData.isActive = row.isActive
  locationFormData.status = row.status
}

const handleLocationSubmit = async () => {
  if (!locationFormRef.value) return

  await locationFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      locationFormData.whId = whId
      if (locationDialogType.value === 'add') {
        await addLocation(locationFormData)
        ElMessage.success('新增库位成功')
      } else {
        await updateLocation(locationFormData.locId!, locationFormData)
        ElMessage.success('修改库位成功')
      }

      locationDialogVisible.value = false
      getLocationListData()
    } catch (error) {
      console.error('库位保存失败:', error)
    }
  })
}

const handleLocationDelete = (row: Location) => {
  ElMessageBox.confirm(`确定删除库位 "${row.locCode}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteLocation(row.locId)
        ElMessage.success('删除库位成功')
        getLocationListData()
      } catch (error) {
        console.error('删除库位失败:', error)
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const goBack = () => {
  router.push('/base/wms')
}

onMounted(async () => {
  if (!whId) {
    ElMessage.error('仓库参数无效')
    goBack()
    return
  }

  await loadWarehouseInfo()
  getLocationListData()
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

.warehouse-tip {
  color: #909399;
  font-weight: 400;
  margin-left: 6px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
