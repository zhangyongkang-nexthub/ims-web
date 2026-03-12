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
          placeholder="搜索工单号或批次号"
          clearable
          class="search-input"
        />
        <el-select
          v-model="searchForm.status"
          placeholder="选择状态"
          clearable
          class="search-select"
        >
          <el-option label="待生产" :value="0" />
          <el-option label="生产中" :value="1" />
          <el-option label="已完成" :value="2" />
          <el-option label="已结案" :value="3" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="woCode" label="工单号" width="140" />
        <el-table-column prop="batchNo" label="批次号" width="140" />
        <el-table-column prop="productName" label="产品名称" width="150" />
        <el-table-column prop="recipeName" label="配方" width="150" />
        <el-table-column prop="targetQty" label="计划产量" width="100" />
        <el-table-column prop="actualQty" label="实际产量" width="100" />
        <el-table-column prop="badQty" label="不良品数" width="100" />
        <el-table-column
          prop="statusLabel"
          label="状态"
          width="100"
          :formatter="(row) => statusFormatter(row.status)"
        />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)"
              >编辑</el-button
            >
            <el-button link type="info" size="small" @click="handleDetail(scope.row)"
              >详情</el-button
            >
            <el-button
              v-if="scope.row.status === 0"
              link
              type="success"
              size="small"
              @click="handleStart(scope.row)"
            >
              开始
            </el-button>
            <el-button
              v-if="scope.row.status === 1"
              link
              type="warning"
              size="small"
              @click="handleReport(scope.row)"
            >
              报工
            </el-button>
            <el-button
              v-if="scope.row.status === 1"
              link
              type="success"
              size="small"
              @click="handleComplete(scope.row)"
            >
              完成
            </el-button>
            <el-button
              v-if="scope.row.status === 2"
              link
              type="success"
              size="small"
              @click="handleClose(scope.row)"
            >
              结案
            </el-button>
            <el-button
              v-if="scope.row.status === 0"
              link
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="45%">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="产品" prop="pId">
          <el-select v-model="formData.pId" placeholder="选择产品" @change="onProductChange">
            <el-option v-for="p in productList" :key="p.pid" :label="p.pname" :value="p.pid" />
          </el-select>
        </el-form-item>
        <el-form-item label="配方" prop="recipeId">
          <el-select v-model="formData.recipeId" placeholder="选择配方">
            <el-option
              v-for="r in filteredRecipes"
              :key="r.recipeId"
              :label="r.recipeName"
              :value="r.recipeId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划产量" prop="targetQty">
          <el-input-number v-model="formData.targetQty" :min="1" />
        </el-form-item>
        <el-form-item label="操作员" prop="operatorId">
          <el-select v-model="formData.operatorId" placeholder="选择操作员">
            <el-option v-for="u in userList" :key="u.id" :label="u.nickname" :value="u.id" />
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

    <!-- 报工对话框 -->
    <el-dialog v-model="reportDialogVisible" title="生产报工" width="35%">
      <el-form :model="reportData" label-width="100px">
        <el-form-item label="产出数量">
          <el-input-number v-model="reportData.actualQty" :min="0" />
        </el-form-item>
        <el-form-item label="不良品数">
          <el-input-number v-model="reportData.badQty" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReport">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  addOrder,
  closeOrder,
  completeProduction,
  deleteOrder,
  getOrderList,
  reportProduction,
  startProduction,
  updateOrder,
  type WorkOrder,
  type WorkOrderForm,
  type WorkOrderReport,
} from '@/api/order'
import { getProductList, type Product } from '@/api/product'
import { getRecipeList, type Recipe } from '@/api/recipe'
import { getUserList, type User } from '@/api/user'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const dialogVisible = ref(false)
const reportDialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<WorkOrder[]>([])
const productList = ref<Product[]>([])
const recipeList = ref<Recipe[]>([])
const userList = ref<User[]>([])
const currentEditingOrder = ref<WorkOrder | null>(null)

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  searchKey: '',
  status: undefined,
})

const formData = reactive<WorkOrderForm>({
  pId: 0,
  recipeId: 0,
  targetQty: 1000,
  operatorId: undefined,
})

const reportData = reactive<WorkOrderReport>({
  actualQty: 0,
  badQty: 0,
})

const rules = {
  pId: [{ required: true, message: '产品不能为空', trigger: 'change' }],
  recipeId: [{ required: true, message: '配方不能为空', trigger: 'change' }],
  targetQty: [{ required: true, message: '计划产量不能为空', trigger: 'blur' }],
}

const dialogTitle = ref('新增工单')

const filteredRecipes = computed(() => {
  return recipeList.value.filter((r) => r.pid === formData.pId)
})

const statusFormatter = (status: number) => {
  const statusMap: { [key: number]: string } = {
    0: '待生产',
    1: '生产中',
    2: '已完成',
    3: '已结案',
  }
  return statusMap[status] || '未知'
}

const getOrderProductId = (row: WorkOrder) => {
  const maybeRow = row as WorkOrder & { pid?: number }
  return row.pId ?? maybeRow.pid ?? 0
}

const getOrderRecipeId = (row: WorkOrder) => {
  const maybeRow = row as WorkOrder & { recipe_id?: number }
  return row.recipeId ?? maybeRow.recipe_id ?? 0
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getOrderList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      searchKey: searchForm.searchKey,
      status: searchForm.status,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取工单列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadAllData = async () => {
  try {
    const [prodRes, recRes, usrRes] = await Promise.all([
      getProductList({ pageSize: 1000 }),
      getRecipeList({ pageSize: 1000 }),
      getUserList({ pageSize: 1000 }),
    ])
    productList.value = prodRes.data.records
    recipeList.value = recRes.data.records
    userList.value = usrRes.data.records
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const onProductChange = () => {
  formData.recipeId = 0
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}

const handleReset = () => {
  searchForm.searchKey = ''
  searchForm.status = undefined
  pagination.pageNum = 1
  getList()
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增工单' : '编辑工单'
  dialogVisible.value = true

  if (type === 'add') {
    currentEditingOrder.value = null
    formData.pId = 0
    formData.recipeId = 0
    formData.targetQty = 1000
    formData.operatorId = undefined
  }
}

const handleEdit = (row: WorkOrder) => {
  if (row.status !== 0) {
    ElMessage.warning('只有待生产状态的工单才能编辑')
    return
  }

  currentEditingOrder.value = row
  dialogType.value = 'edit'
  dialogTitle.value = '编辑工单'
  dialogVisible.value = true

  formData.pId = getOrderProductId(row)
  formData.recipeId = getOrderRecipeId(row)
  formData.targetQty = row.targetQty
  formData.operatorId = row.operatorId
}

const handleDetail = (row: WorkOrder) => {
  ElMessage.info('工单详情功能待实现')
}

const handleStart = (row: WorkOrder) => {
  ElMessageBox.confirm('确定开始生产吗?', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        const res = await startProduction(row.woId)
        ElMessage.success(`生产已开始，批次号: ${res.data}`)
        getList()
      } catch (error) {
        console.error('开始生产失败:', error)
      }
    })
    .catch(() => {
      ElMessage.info('已取消')
    })
}

const handleReport = (row: WorkOrder) => {
  currentEditingOrder.value = row
  reportData.actualQty = 0
  reportData.badQty = 0
  reportDialogVisible.value = true
}

const submitReport = async () => {
  if (!currentEditingOrder.value) return

  try {
    await reportProduction(currentEditingOrder.value.woId, reportData)
    ElMessage.success('报工成功')
    reportDialogVisible.value = false
    getList()
  } catch (error) {
    console.error('报工失败:', error)
  }
}

const handleComplete = (row: WorkOrder) => {
  ElMessageBox.confirm('确定完成生产吗?', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await completeProduction(row.woId)
        ElMessage.success('生产已完成')
        getList()
      } catch (error) {
        console.error('完成生产失败:', error)
      }
    })
    .catch(() => {
      ElMessage.info('已取消')
    })
}

const handleClose = (row: WorkOrder) => {
  ElMessageBox.confirm('确定结案归档吗?', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await closeOrder(row.woId)
        ElMessage.success('工单已结案')
        getList()
      } catch (error) {
        console.error('结案失败:', error)
      }
    })
    .catch(() => {
      ElMessage.info('已取消')
    })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (dialogType.value === 'add') {
        await addOrder(formData)
        ElMessage.success('新增成功')
      } else {
        if (!currentEditingOrder.value) {
          ElMessage.error('未找到要编辑的工单')
          return
        }
        await updateOrder(currentEditingOrder.value.woId, formData)
        ElMessage.success('修改成功')
      }

      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleDelete = (row: WorkOrder) => {
  ElMessageBox.confirm(`确定删除工单 "${row.woCode}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteOrder(row.woId)
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

.dialog-footer {
  text-align: right;
}
</style>
