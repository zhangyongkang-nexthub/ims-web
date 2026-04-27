<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>维修工单管理</span>
          <el-button type="primary" @click="openDialog('add')">新增报修</el-button>
        </div>
      </template>

      <div class="search-form">
        <el-input
          v-model="searchForm.searchKey"
          placeholder="工单号/故障描述"
          clearable
          class="search-input"
        />
        <el-select
          v-model="searchForm.equipId"
          placeholder="设备"
          clearable
          class="search-select"
          filterable
        >
          <el-option
            v-for="e in equipmentList"
            :key="e.equipId"
            :label="`${e.equipName}(${e.equipCode})`"
            :value="e.equipId"
          />
        </el-select>
        <el-select v-model="searchForm.status" placeholder="状态" clearable class="search-select">
          <el-option label="待修" :value="0" />
          <el-option label="维修中" :value="1" />
          <el-option label="已完成" :value="2" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="tableData" stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="orderNo" label="工单号" width="200" />
        <el-table-column prop="equipName" label="设备" width="150" />
        <el-table-column prop="faultDesc" label="故障描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="sourceTypeLabel" label="来源" width="100" />
        <el-table-column prop="priorityLabel" label="优先级" width="100" />
        <el-table-column prop="repairUser" label="维修负责人" width="120" />
        <el-table-column prop="statusLabel" label="状态" width="100" />
        <el-table-column prop="startTime" label="开始时间" width="170" />
        <el-table-column prop="endTime" label="结束时间" width="170" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-button
              v-if="row.status === 0"
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
              >删除</el-button
            >
            <el-button
              v-if="row.status === 0"
              link
              type="warning"
              size="small"
              @click="handleStart(row)"
              >开始维修</el-button
            >
            <el-button
              v-if="row.status === 1"
              link
              type="success"
              size="small"
              @click="handleComplete(row)"
              >完成维修</el-button
            >
            <el-button link type="info" size="small" @click="handleDetail(row)">详情</el-button>
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
        <el-form-item label="设备" prop="equipId">
          <el-select v-model="formData.equipId" placeholder="选择设备" filterable>
            <el-option
              v-for="e in equipmentList"
              :key="e.equipId"
              :label="`${e.equipName}(${e.equipCode})`"
              :value="e.equipId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="故障描述">
          <el-input v-model="formData.faultDesc" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="formData.sourceType">
            <el-option label="人工报修" :value="1" />
            <el-option label="AI自动触发" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="formData.priority">
            <el-option label="普通" :value="1" />
            <el-option label="紧急" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="维修负责人">
          <el-input v-model="formData.repairUser" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="维修工单详情" width="620px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="工单号">{{ detailData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="设备">{{ detailData.equipName }}</el-descriptions-item>
        <el-descriptions-item label="故障描述">{{
          detailData.faultDesc || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ detailData.sourceTypeLabel }}</el-descriptions-item>
        <el-descriptions-item label="优先级">{{ detailData.priorityLabel }}</el-descriptions-item>
        <el-descriptions-item label="维修负责人">{{
          detailData.repairUser || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detailData.statusLabel }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{
          detailData.startTime || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{
          detailData.endTime || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{
          detailData.createTime || '-'
        }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { getEquipmentList, type Equipment } from '@/api/equipment'
import {
  addRepairOrder,
  completeRepairOrder,
  deleteRepairOrder,
  getRepairOrderDetail,
  getRepairOrderList,
  startRepairOrder,
  updateRepairOrder,
  type RepairOrder,
  type RepairOrderForm,
} from '@/api/repairOrder'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<RepairOrder[]>([])
const equipmentList = ref<Equipment[]>([])
const dialogTitle = ref('新增报修')

const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const searchForm = reactive<{ searchKey: string; equipId?: string; status?: number }>({
  searchKey: '',
  equipId: undefined,
  status: undefined,
})

const formData = reactive<RepairOrderForm>({
  equipId: '',
  faultDesc: '',
  sourceType: 1,
  priority: 1,
  repairUser: '',
})

const rules = {
  equipId: [{ required: true, message: '设备不能为空', trigger: 'change' }],
}

const detailDialogVisible = ref(false)
const detailData = ref<RepairOrder | null>(null)

const getList = async () => {
  loading.value = true
  try {
    const res = await getRepairOrderList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      equipId: searchForm.equipId,
      status: searchForm.status,
      searchKey: searchForm.searchKey || undefined,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

const loadEquipmentList = async () => {
  const res = await getEquipmentList({ pageSize: 1000 })
  equipmentList.value = res.data.records
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}

const handleReset = () => {
  searchForm.searchKey = ''
  searchForm.equipId = undefined
  searchForm.status = undefined
  pagination.pageNum = 1
  getList()
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增报修' : '编辑报修'
  if (type === 'add') {
    ;(formData as any).repairId = undefined
    formData.equipId = ''
    formData.faultDesc = ''
    formData.sourceType = 1
    formData.priority = 1
    formData.repairUser = ''
  }
  dialogVisible.value = true
}

const handleEdit = (row: RepairOrder) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑报修'
  ;(formData as any).repairId = row.repairId
  formData.equipId = row.equipId
  formData.faultDesc = row.faultDesc || ''
  formData.sourceType = row.sourceType || 1
  formData.priority = row.priority || 1
  formData.repairUser = row.repairUser || ''
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (dialogType.value === 'add') {
      await addRepairOrder(formData)
      ElMessage.success('报修成功')
    } else {
      await updateRepairOrder((formData as any).repairId, formData)
      ElMessage.success('修改成功')
    }
    dialogVisible.value = false
    getList()
  })
}

const handleDelete = (row: RepairOrder) => {
  ElMessageBox.confirm(`确定删除工单「${row.orderNo}」吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteRepairOrder(row.repairId)
      ElMessage.success('删除成功')
      getList()
    })
    .catch(() => {})
}

const handleStart = (row: RepairOrder) => {
  ElMessageBox.confirm('确定开始维修吗？', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await startRepairOrder(row.repairId)
      ElMessage.success('已开始维修')
      getList()
    })
    .catch(() => {})
}

const handleComplete = (row: RepairOrder) => {
  ElMessageBox.confirm('确定完成维修吗？', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await completeRepairOrder(row.repairId)
      ElMessage.success('维修已完成')
      getList()
    })
    .catch(() => {})
}

const handleDetail = async (row: RepairOrder) => {
  const res = await getRepairOrderDetail(row.repairId)
  detailData.value = res.data
  detailDialogVisible.value = true
}

onMounted(() => {
  getList()
  loadEquipmentList()
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
  width: 240px;
}
.search-select {
  width: 200px;
}
.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
