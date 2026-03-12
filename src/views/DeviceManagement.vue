<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>设备管理</span>
          <el-button type="primary" @click="openDialog('add')">新增设备</el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <div class="search-form">
        <el-input
          v-model="searchForm.searchKey"
          placeholder="搜索设备编码"
          clearable
          class="search-input"
        />
        <el-select
          v-model="searchForm.stationId"
          placeholder="选择工位"
          clearable
          class="search-select"
        >
          <el-option
            v-for="s in stationList"
            :key="s.stationId"
            :label="s.stationName"
            :value="s.stationId"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="deviceCode" label="设备编码" width="140" />
        <el-table-column prop="stationName" label="所属工位" width="120" />
        <el-table-column prop="deviceType" label="设备类型" width="100" />
        <el-table-column
          prop="status"
          label="状态"
          width="80"
          :formatter="(row) => (row.status === 1 ? '启用' : '禁用')"
        />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)"
              >编辑</el-button
            >
            <el-button link type="danger" size="small" @click="handleDelete(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
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

    <!-- 编辑/新增对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="40%">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="工位" prop="stationId">
          <el-select v-model="formData.stationId" placeholder="选择工位">
            <el-option
              v-for="s in stationList"
              :key="s.stationId"
              :label="s.stationName"
              :value="s.stationId"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="dialogType === 'edit'" label="设备编码">
          <el-input v-model="formData.deviceCode" disabled />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceType">
          <el-input v-model="formData.deviceType" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  addDevice,
  deleteDevice,
  getDeviceList,
  updateDevice,
  type Device,
  type DeviceForm,
} from '@/api/device'
import { getStationList, type Station } from '@/api/station'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<Device[]>([])
const stationList = ref<Station[]>([])

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  searchKey: '',
  stationId: undefined,
})

const formData = reactive<DeviceForm>({
  stationId: 0,
  deviceCode: '',
  deviceType: '',
  status: 1,
})

const rules = {
  stationId: [{ required: true, message: '工位不能为空', trigger: 'change' }],
  deviceType: [{ required: true, message: '设备类型不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }],
}

const dialogTitle = ref('新增设备')

const getList = async () => {
  loading.value = true
  try {
    const res = await getDeviceList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      searchKey: searchForm.searchKey,
      stationId: searchForm.stationId,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取设备列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadStationList = async () => {
  try {
    const res = await getStationList({ pageSize: 1000 })
    stationList.value = res.data.records
  } catch (error) {
    console.error('加载工位列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}

const handleReset = () => {
  searchForm.searchKey = ''
  searchForm.stationId = undefined
  pagination.pageNum = 1
  getList()
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增设备' : '编辑设备'
  dialogVisible.value = true

  if (type === 'add') {
    formData.stationId = 0
    formData.deviceType = ''
    formData.status = 1
  }
}

const handleEdit = (row: Device) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑设备'
  dialogVisible.value = true

  formData.deviceId = row.deviceId
  formData.stationId = row.stationId
  formData.deviceCode = row.deviceCode
  formData.deviceType = row.deviceType
  formData.status = row.status
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (dialogType.value === 'add') {
        await addDevice(formData)
        ElMessage.success('新增成功')
      } else {
        await updateDevice(formData.deviceId!, formData)
        ElMessage.success('修改成功')
      }

      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleDelete = (row: Device) => {
  ElMessageBox.confirm(`确定删除设备 "${row.deviceCode}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteDevice(row.deviceId)
        ElMessage.success('删除成功')
        getList()
      } catch (error) {
        console.error('删除失败:', error)
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

onMounted(() => {
  getList()
  loadStationList()
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

.search-input {
  width: 200px;
}

.search-select {
  width: 150px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}
</style>
