<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>客户管理</span>
          <el-button type="primary" @click="openDialog('add')">新增客户</el-button>
        </div>
      </template>

      <div class="search-form">
        <el-input
          v-model="searchForm.searchKey"
          placeholder="搜索客户编码或名称"
          clearable
          class="search-input"
        />
        <el-select
          v-model="searchForm.searchStatus"
          placeholder="选择状态"
          clearable
          class="search-select"
        >
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="custCode" label="客户编码" width="220" />
        <el-table-column prop="custName" label="客户名称" width="180" />
        <el-table-column prop="custType" label="客户类型" width="120">
          <template #default="scope">
            {{ getCustomerTypeLabel(scope.row.custType) }}
          </template>
        </el-table-column>
        <el-table-column prop="contactPerson" label="联系人" width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="140" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column
          prop="status"
          label="状态"
          width="80"
          :formatter="(row) => (row.status === 1 ? '启用' : '禁用')"
        />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="40%">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item v-if="dialogType === 'edit'" label="客户编码">
          <el-input v-model="formData.custCode" disabled />
        </el-form-item>
        <el-form-item label="客户名称" prop="custName">
          <el-input v-model="formData.custName" />
        </el-form-item>
        <el-form-item label="客户类型" prop="custType">
          <el-select v-model="formData.custType" placeholder="请选择客户类型" clearable>
            <el-option
              v-for="item in customerTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="formData.contactPerson" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="formData.contactPhone" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="formData.address" type="textarea" :rows="2" />
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
  addCustomer,
  deleteCustomer,
  getCustomerList,
  updateCustomer,
  type Customer,
  type CustomerForm,
} from '@/api/customer'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const dialogTitle = ref('新增客户')
const formRef = ref<FormInstance>()
const tableData = ref<Customer[]>([])

const customerTypeOptions = [
  { label: '经销商', value: 1 },
  { label: '直营店', value: 2 },
  { label: '其他', value: 3 },
]

const getCustomerTypeLabel = (value?: number) => {
  const option = customerTypeOptions.find((item) => item.value === value)
  return option?.label || '未知'
}

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  searchKey: '',
  searchStatus: undefined as number | undefined,
})

const formData = reactive<CustomerForm>({
  custCode: '',
  custName: '',
  custType: 1,
  contactPerson: '',
  contactPhone: '',
  address: '',
  status: 1,
})

const rules = {
  custName: [{ required: true, message: '客户名称不能为空', trigger: 'blur' }],
  custType: [{ required: true, message: '客户类型不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getCustomerList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      searchKey: searchForm.searchKey,
      searchStatus: searchForm.searchStatus,
    })
    tableData.value = res.data.records || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('获取客户列表失败:', error)
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
  searchForm.searchStatus = undefined
  pagination.pageNum = 1
  getList()
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增客户' : '编辑客户'
  dialogVisible.value = true

  if (type === 'add') {
    formData.custId = undefined
    formData.custCode = ''
    formData.custName = ''
    formData.custType = 1
    formData.contactPerson = ''
    formData.contactPhone = ''
    formData.address = ''
    formData.status = 1
  }
}

const handleEdit = (row: Customer) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑客户'
  dialogVisible.value = true

  formData.custId = row.custId
  formData.custCode = row.custCode
  formData.custName = row.custName
  formData.custType = row.custType ?? 1
  formData.contactPerson = row.contactPerson || ''
  formData.contactPhone = row.contactPhone || ''
  formData.address = row.address || ''
  formData.status = row.status
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (dialogType.value === 'add') {
        await addCustomer(formData)
        ElMessage.success('新增成功')
      } else {
        await updateCustomer(formData.custId!, formData)
        ElMessage.success('修改成功')
      }

      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleDelete = (row: Customer) => {
  ElMessageBox.confirm(`确定删除客户 "${row.custName}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteCustomer(row.custId)
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

getList()
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
