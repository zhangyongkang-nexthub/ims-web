<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>进货批次管理</span>
          <el-button type="primary" @click="openDialog('add')">新增批次</el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <div class="search-form">
        <el-input
          v-model="searchForm.searchKey"
          placeholder="搜索进货批次号"
          clearable
          class="search-input"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="lotNo" label="批次号" width="140" />
        <el-table-column prop="mname" label="物料名称" width="150" />
        <el-table-column prop="supName" label="供应商名称" width="150" />
        <el-table-column prop="arrivalQty" label="到货数量" width="100" />
        <el-table-column prop="arrivalTime" label="到货时间" width="180" />
        <el-table-column prop="expiryDate" label="有效期" width="120" />
        <el-table-column prop="statusLabel" label="QC状态" width="80" />
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="50%">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item v-if="dialogType === 'edit'" label="批次号">
          <el-input v-model="formData.lotNo" disabled />
        </el-form-item>
        <el-form-item label="物料" prop="mId">
          <el-select v-model="formData.mId" placeholder="选择物料">
            <el-option v-for="m in materialList" :key="m.mid" :label="m.mname" :value="m.mid" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商" prop="supId">
          <el-select v-model="formData.supId" placeholder="选择供应商">
            <el-option
              v-for="s in supplierList"
              :key="s.supId"
              :label="s.supName"
              :value="s.supId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="到货数量" prop="arrivalQty">
          <el-input-number v-model="formData.arrivalQty" :min="0" />
        </el-form-item>
        <el-form-item label="到货时间" prop="arrivalTime">
          <el-date-picker v-model="formData.arrivalTime" type="datetime" />
        </el-form-item>
        <el-form-item label="有效期" prop="expiryDate">
          <el-date-picker v-model="formData.expiryDate" type="date" />
        </el-form-item>
        <el-form-item label="QC状态" prop="qcStatus">
          <el-select v-model="formData.qcStatus">
            <el-option label="合格" :value="1" />
            <el-option label="不合格" :value="0" />
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
import { getMaterialList, type Material } from '@/api/material'
import {
  addMaterialLot,
  deleteMaterialLot,
  getMaterialLotList,
  updateMaterialLot,
  type MaterialLot,
  type MaterialLotForm,
} from '@/api/materialLot'
import { getSupplierList, type Supplier } from '@/api/supplier'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<MaterialLot[]>([])
const materialList = ref<Material[]>([])
const supplierList = ref<Supplier[]>([])

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  searchKey: '',
})

const formData = reactive<MaterialLotForm>({
  lotNo: undefined,
  mId: 0,
  supId: 0,
  arrivalQty: 0,
  qcStatus: 1,
  arrivalTime: '',
  expiryDate: '',
})

const rules = {
  mId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  supId: [{ required: true, message: '供应商不能为空', trigger: 'change' }],
  arrivalQty: [{ required: true, message: '到货数量不能为空', trigger: 'blur' }],
  arrivalTime: [{ required: true, message: '到货时间不能为空', trigger: 'change' }],
  expiryDate: [{ required: true, message: '有效期不能为空', trigger: 'change' }],
}

const dialogTitle = ref('新增批次')

const getList = async () => {
  loading.value = true
  try {
    const res = await getMaterialLotList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      searchKey: searchForm.searchKey,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取进货列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadSelectionData = async () => {
  try {
    const [matRes, supRes] = await Promise.all([
      getMaterialList({ pageSize: 1000 }),
      getSupplierList({ pageSize: 1000 }),
    ])
    materialList.value = matRes.data.records
    supplierList.value = supRes.data.records
  } catch (error) {
    console.error('加载下拉列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}

const handleReset = () => {
  searchForm.searchKey = ''
  pagination.pageNum = 1
  getList()
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增批次' : '编辑批次'
  dialogVisible.value = true

  if (type === 'add') {
    formData.lotNo = undefined
    formData.mId = 0
    formData.supId = 0
    formData.arrivalQty = 0
    formData.qcStatus = 1
    formData.arrivalTime = ''
    formData.expiryDate = ''
  }
}

const handleEdit = (row: MaterialLot) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑批次'
  dialogVisible.value = true

  formData.lotId = row.lotId
  formData.lotNo = row.lotNo
  formData.mId = row.mid
  formData.supId = row.supId
  formData.arrivalQty = row.arrivalQty
  formData.qcStatus = row.status
  formData.arrivalTime = row.arrivalTime || ''
  formData.expiryDate = row.expiryDate
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (dialogType.value === 'add') {
        await addMaterialLot(formData)
        ElMessage.success('新增成功')
      } else {
        await updateMaterialLot(formData.lotId!, formData)
        ElMessage.success('修改成功')
      }

      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleDelete = (row: MaterialLot) => {
  ElMessageBox.confirm(`确定删除批次 "${row.lotNo}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteMaterialLot(row.lotId)
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
  loadSelectionData()
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

.pagination {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}
</style>
