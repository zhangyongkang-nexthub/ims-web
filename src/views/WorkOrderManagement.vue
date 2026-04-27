<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>工单管理</span>
          <el-button type="primary" @click="openDialog('add')">新增工单</el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <div class="search-form">
        <el-input
          v-model="searchForm.searchKey"
          placeholder="搜索工单号"
          clearable
          class="search-input"
        />
        <el-select v-model="searchForm.pId" placeholder="选择产品" clearable class="search-select">
          <el-option v-for="p in productList" :key="p.pid" :label="p.pname" :value="p.pid" />
        </el-select>
        <el-select
          v-model="searchForm.status"
          placeholder="选择状态"
          clearable
          class="search-select"
        >
          <el-option label="待生产" :value="0" />
          <el-option label="生产中" :value="1" />
          <el-option label="已完成" :value="2" />
          <el-option label="已关闭" :value="3" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="woNo" label="工单号" width="160" />
        <el-table-column prop="productName" label="产品" width="140" />
        <el-table-column prop="customerName" label="客户" width="120" />
        <el-table-column prop="recipeName" label="配方" width="140" />
        <el-table-column label="进度" width="160">
          <template #default="{ row }">
            <span>{{ row.completedQty }} / {{ row.targetQty }}</span>
            <el-progress
              :percentage="Math.min(Math.round((row.completedQty / row.targetQty) * 100), 100)"
              :stroke-width="6"
              style="margin-top: 2px"
            />
          </template>
        </el-table-column>
        <el-table-column prop="batchCount" label="批次数" width="80" align="center" />
        <el-table-column prop="statusLabel" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.statusLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="plannedStart" label="计划开始" width="170" />
        <el-table-column prop="plannedEnd" label="计划结束" width="170" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-button link type="info" size="small" @click="goDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 0"
              link
              type="success"
              size="small"
              @click="goDetail(row)"
              >启动批次</el-button
            >
            <el-button
              v-if="row.status === 1 || row.status === 2"
              link
              type="warning"
              size="small"
              @click="handleClose(row)"
              >关闭</el-button
            >
            <el-button
              v-if="row.status === 0"
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
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

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="45%">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="110px"
        label-position="right"
      >
        <el-form-item label="产品" prop="pId">
          <el-select
            v-model="formData.pId"
            placeholder="选择产品"
            filterable
            @change="onProductChange"
          >
            <el-option v-for="p in productList" :key="p.pid" :label="p.pname" :value="p.pid" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户" prop="customerId">
          <el-select
            v-model="formData.customerId"
            placeholder="选择客户（可选）"
            filterable
            clearable
          >
            <el-option
              v-for="c in customerList"
              :key="c.custId"
              :label="c.custName"
              :value="c.custId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="配方" prop="recipeId">
          <el-select v-model="formData.recipeId" placeholder="选择配方" filterable>
            <el-option
              v-for="r in filteredRecipes"
              :key="r.recipeId"
              :label="r.recipeName"
              :value="r.recipeId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划产量" prop="targetQty">
          <el-input-number v-model="formData.targetQty" :min="1" style="width: 220px" />
        </el-form-item>
        <el-form-item label="计划开始时间">
          <el-date-picker
            v-model="formData.plannedStart"
            type="datetime"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="计划结束时间">
          <el-date-picker
            v-model="formData.plannedEnd"
            type="datetime"
            placeholder="选择结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { getCustomerList, type Customer } from '@/api/customer'
import { getProductList, type Product } from '@/api/product'
import { getRecipeList, type Recipe } from '@/api/recipe'
import {
  addWorkOrder,
  closeWorkOrder,
  deleteWorkOrder,
  getWorkOrderList,
  updateWorkOrder,
  type WorkOrder,
  type WorkOrderForm,
} from '@/api/workOrder'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const dialogTitle = ref('新增工单')
const formRef = ref<FormInstance>()
const tableData = ref<WorkOrder[]>([])
const productList = ref<Product[]>([])
const recipeList = ref<Recipe[]>([])
const customerList = ref<Customer[]>([])

const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })

const searchForm = reactive<{ searchKey: string; pId?: number; status?: number }>({
  searchKey: '',
  pId: undefined,
  status: undefined,
})

const formData = reactive<WorkOrderForm>({
  pId: 0,
  customerId: undefined,
  recipeId: 0,
  targetQty: 1000,
  plannedStart: undefined,
  plannedEnd: undefined,
})

const rules = {
  pId: [{ required: true, message: '请选择产品', trigger: 'change' }],
  recipeId: [{ required: true, message: '请选择配方', trigger: 'change' }],
  targetQty: [{ required: true, message: '请输入计划产量', trigger: 'blur' }],
}

const filteredRecipes = computed(() => recipeList.value.filter((r) => r.pid === formData.pId))

const statusTagType = (status: number) => {
  const map: Record<number, string> = { 0: 'info', 1: '', 2: 'success', 3: 'danger' }
  return map[status] ?? 'info'
}

// ---- 列表 ----
const getList = async () => {
  loading.value = true
  try {
    const res = await getWorkOrderList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      searchKey: searchForm.searchKey || undefined,
      pId: searchForm.pId,
      status: searchForm.status,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}
const handleReset = () => {
  searchForm.searchKey = ''
  searchForm.pId = undefined
  searchForm.status = undefined
  pagination.pageNum = 1
  getList()
}

// ---- 新增/编辑 ----
const onProductChange = () => {
  formData.recipeId = 0
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增工单' : '编辑工单'
  if (type === 'add') {
    formData.woId = undefined
    formData.pId = 0
    formData.customerId = undefined
    formData.recipeId = 0
    formData.targetQty = 1000
    formData.plannedStart = undefined
    formData.plannedEnd = undefined
  }
  dialogVisible.value = true
}

const handleEdit = (row: WorkOrder) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑工单'
  formData.woId = row.woId
  formData.pId = row.pId
  formData.customerId = row.customerId
  formData.recipeId = row.recipeId
  formData.targetQty = row.targetQty
  formData.plannedStart = row.plannedStart
  formData.plannedEnd = row.plannedEnd
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      if (dialogType.value === 'add') {
        await addWorkOrder(formData)
        ElMessage.success('新增成功')
      } else {
        await updateWorkOrder(formData)
        ElMessage.success('修改成功')
      }
      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

// ---- 删除 ----
const handleDelete = (row: WorkOrder) => {
  ElMessageBox.confirm(`确定删除工单「${row.woNo}」吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteWorkOrder(row.woId)
      ElMessage.success('删除成功')
      getList()
    })
    .catch(() => {})
}

// ---- 关闭 ----
const handleClose = (row: WorkOrder) => {
  ElMessageBox.confirm('确定关闭/结案该工单吗?', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await closeWorkOrder(row.woId)
      ElMessage.success('工单已关闭')
      getList()
    })
    .catch(() => {})
}

// ---- 详情 ----
const goDetail = (row: WorkOrder) => {
  router.push({ name: 'WorkOrderDetail', params: { woId: String(row.woId) } })
}

// ---- 初始化 ----
const loadAllData = async () => {
  const [prodRes, recRes, custRes] = await Promise.all([
    getProductList({ pageSize: 1000 }),
    getRecipeList({ pageSize: 1000 }),
    getCustomerList({ pageSize: 1000 }),
  ])
  productList.value = prodRes.data.records
  recipeList.value = recRes.data.records
  customerList.value = custRes.data.records
}

onMounted(() => {
  getList()
  loadAllData()
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
</style>
