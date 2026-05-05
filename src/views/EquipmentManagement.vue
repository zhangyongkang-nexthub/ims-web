<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>生产设备管理</span>
          <el-button type="primary" @click="openDialog('add')">新增设备</el-button>
        </div>
      </template>

      <div class="search-form">
        <el-input
          v-model="searchForm.searchKey"
          placeholder="搜索设备名称/编码"
          clearable
          class="search-input"
        />
        <el-select
          v-model="searchForm.stationId"
          placeholder="工位"
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
        <el-select v-model="searchForm.status" placeholder="状态" clearable class="search-select">
          <el-option label="运行" :value="1" />
          <el-option label="故障" :value="2" />
          <el-option label="维保" :value="3" />
          <el-option label="报废" :value="0" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="tableData" stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="equipCode" label="设备编码" width="140" />
        <el-table-column prop="equipName" label="设备名称" width="160" />
        <el-table-column prop="model" label="型号" width="120" />
        <el-table-column prop="stationName" label="工位" width="140" />
        <el-table-column prop="sensorCount" label="传感器数" width="90" align="center" />
        <el-table-column prop="statusLabel" label="状态" width="100" />
        <el-table-column prop="installDate" label="安装日期" width="120" />
        <el-table-column prop="expiryDate" label="到期日期" width="120" />
        <el-table-column prop="createTime" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="info" size="small" @click="handleDetail(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="openStatusDialog(row)"
              >改状态</el-button
            >
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @change="getList"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item v-if="dialogType === 'edit'" label="设备编码">
          <el-input v-model="formData.equipCode" disabled />
        </el-form-item>
        <el-form-item label="设备名称" prop="equipName">
          <el-input v-model="formData.equipName" />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="formData.model" />
        </el-form-item>
        <el-form-item label="所属工位" prop="stationId">
          <el-select v-model="formData.stationId" placeholder="选择工位">
            <el-option
              v-for="s in stationList"
              :key="s.stationId"
              :label="s.stationName"
              :value="s.stationId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status">
            <el-option label="运行" :value="1" />
            <el-option label="故障" :value="2" />
            <el-option label="维保" :value="3" />
            <el-option label="报废" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装日期">
          <el-date-picker v-model="formData.installDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="到期日期">
          <el-date-picker v-model="formData.expiryDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="statusDialogVisible" title="修改设备状态" width="420px">
      <el-form label-width="100px">
        <el-form-item label="设备">
          <el-input :model-value="statusTarget?.equipName || ''" disabled />
        </el-form-item>
        <el-form-item label="新状态">
          <el-select v-model="statusForm.status" placeholder="选择状态">
            <el-option label="运行" :value="1" />
            <el-option label="故障" :value="2" />
            <el-option label="维保" :value="3" />
            <el-option label="报废" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStatusSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="设备详情" width="860px">
      <el-descriptions :column="3" border v-if="detailData">
        <el-descriptions-item label="设备编码">{{
          detailData.equipment.equipCode
        }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{
          detailData.equipment.equipName
        }}</el-descriptions-item>
        <el-descriptions-item label="工位">{{
          detailData.equipment.stationName
        }}</el-descriptions-item>
        <el-descriptions-item label="型号">{{
          detailData.equipment.model || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          detailData.equipment.statusLabel
        }}</el-descriptions-item>
        <el-descriptions-item label="安装日期">{{
          detailData.equipment.installDate || '-'
        }}</el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 14px; font-weight: 600">挂载传感器</div>
      <el-table :data="detailData?.sensors || []" stripe style="width: 100%; margin-top: 8px">
        <el-table-column prop="deviceCode" label="传感器编码" width="170" />
        <el-table-column prop="deviceType" label="类型" width="100" />
        <el-table-column label="分析类别" min-width="180">
          <template #default="{ row }">{{ row.sensorCategoryLabel || '—' }}</template>
        </el-table-column>
        <el-table-column prop="kafkaTopic" label="Kafka Topic" min-width="180" />
        <el-table-column prop="redisKey" label="Redis Key" min-width="180" />
        <el-table-column prop="statusLabel" label="状态" width="90" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  addEquipment,
  deleteEquipment,
  getEquipmentDetail,
  getEquipmentList,
  updateEquipment,
  updateEquipmentStatus,
  type Equipment,
  type EquipmentDetail,
  type EquipmentForm,
} from '@/api/equipment'
import { getStationList, type Station } from '@/api/station'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<Equipment[]>([])
const stationList = ref<Station[]>([])
const dialogTitle = ref('新增设备')

const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const searchForm = reactive<{ searchKey: string; stationId?: number; status?: number }>({
  searchKey: '',
  stationId: undefined,
  status: undefined,
})

const formData = reactive<EquipmentForm>({
  equipCode: '',
  equipName: '',
  model: '',
  stationId: 0,
  status: 1,
  installDate: '',
  expiryDate: '',
})

const rules = {
  equipName: [{ required: true, message: '设备名称不能为空', trigger: 'blur' }],
  stationId: [{ required: true, message: '工位不能为空', trigger: 'change' }],
}

const statusDialogVisible = ref(false)
const statusTarget = ref<Equipment | null>(null)
const statusForm = reactive({ status: 1 })

const detailDialogVisible = ref(false)
const detailData = ref<EquipmentDetail | null>(null)

const getList = async () => {
  loading.value = true
  try {
    const res = await getEquipmentList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      searchKey: searchForm.searchKey || undefined,
      stationId: searchForm.stationId,
      status: searchForm.status,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

const loadStationList = async () => {
  const res = await getStationList({ pageSize: 1000 })
  stationList.value = res.data.records
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}

const handleReset = () => {
  searchForm.searchKey = ''
  searchForm.stationId = undefined
  searchForm.status = undefined
  pagination.pageNum = 1
  getList()
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增设备' : '编辑设备'
  if (type === 'add') {
    // 新增时设备编码由后端自动生成
    formData.equipCode = ''
    formData.equipName = ''
    formData.model = ''
    formData.stationId = 0
    formData.status = 1
    formData.installDate = ''
    formData.expiryDate = ''
    ;(formData as any).equipId = undefined
  }
  dialogVisible.value = true
}

const handleEdit = (row: Equipment) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑设备'
  ;(formData as any).equipId = row.equipId
  formData.equipCode = row.equipCode
  formData.equipName = row.equipName
  formData.model = row.model || ''
  formData.stationId = row.stationId
  formData.status = row.status
  formData.installDate = row.installDate || ''
  formData.expiryDate = row.expiryDate || ''
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (dialogType.value === 'add') {
      await addEquipment(formData)
      ElMessage.success('新增成功')
    } else {
      await updateEquipment((formData as any).equipId, formData)
      ElMessage.success('修改成功')
    }
    dialogVisible.value = false
    getList()
  })
}

const handleDelete = (row: Equipment) => {
  ElMessageBox.confirm(`确定删除设备「${row.equipName}」吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteEquipment(row.equipId)
      ElMessage.success('删除成功')
      getList()
    })
    .catch(() => {})
}

const openStatusDialog = (row: Equipment) => {
  statusTarget.value = row
  statusForm.status = row.status
  statusDialogVisible.value = true
}

const handleStatusSubmit = async () => {
  if (!statusTarget.value) return
  await updateEquipmentStatus(statusTarget.value.equipId, statusForm.status)
  ElMessage.success('状态已更新')
  statusDialogVisible.value = false
  getList()
}

const handleDetail = async (row: Equipment) => {
  const res = await getEquipmentDetail(row.equipId)
  detailData.value = res.data
  detailDialogVisible.value = true
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
