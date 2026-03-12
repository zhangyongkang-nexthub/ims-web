<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>物料管理</span>
          <el-button type="primary" @click="openDialog('add')">新增物料</el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <div class="search-form">
        <el-input
          v-model="searchForm.searchKey"
          placeholder="搜索物料名称或编码"
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

      <!-- 数据表格 -->
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="mcode" label="物料编码" width="120" />
        <el-table-column prop="mname" label="物料名称" width="150" />
        <el-table-column prop="mtype" label="物料类型" width="120">
          <template #default="scope">
            {{ getMaterialTypeLabel(scope.row.mType ?? scope.row.mtype) }}
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="100">
          <template #default="scope">
            {{ getUnitTypeLabel(scope.row.unit) }}
          </template>
        </el-table-column>
        <el-table-column prop="shelfLife" label="保质期(天)" width="100" />
        <el-table-column prop="specDesc" label="规格描述" show-overflow-tooltip />
        <el-table-column
          prop="status"
          label="状态"
          width="80"
          :formatter="(row) => (row.status === 1 ? '启用' : '禁用')"
        />
        <el-table-column prop="createTime" label="创建时间" width="180" />
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
        <el-form-item v-if="dialogType === 'edit'" label="物料编码">
          <el-input v-model="formData.mCode" disabled />
        </el-form-item>
        <el-form-item label="物料名称" prop="mName">
          <el-input v-model="formData.mName" />
        </el-form-item>
        <el-form-item label="物料类型" prop="mType">
          <el-select v-model="formData.mType" placeholder="请选择物料类型">
            <el-option
              v-for="item in materialTypeOptions"
              :key="item.id"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-select v-model="formData.unit" placeholder="请选择单位">
            <el-option
              v-for="item in unitTypeOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="保质期(天)" prop="shelfLife">
          <el-input v-model.number="formData.shelfLife" type="number" />
        </el-form-item>
        <el-form-item label="规格描述" prop="specDesc">
          <el-input v-model="formData.specDesc" type="textarea" :rows="3" />
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
  addMaterial,
  deleteMaterial,
  getMaterialList,
  updateMaterial,
  type Material,
  type MaterialForm,
} from '@/api/material'
import { useDictData } from '@/composables/useDictData'
import { DICT_TYPE } from '@/constants/dict'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<Material[]>([])

const {
  options: materialTypeOptions,
  getLabel: getMaterialTypeLabel,
  load: loadMaterialTypeDict,
} = useDictData(DICT_TYPE.MATERIAL_TYPE)

const {
  options: unitTypeOptions,
  getLabel: getUnitTypeLabel,
  load: loadUnitTypeDict,
} = useDictData(DICT_TYPE.UNIT_TYPE)

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  searchKey: '',
  searchStatus: undefined,
})

const formData = reactive<MaterialForm>({
  mCode: '',
  mName: '',
  mType: '',
  unit: '',
  shelfLife: 365,
  specDesc: '',
  status: 1,
})

const rules = {
  mName: [{ required: true, message: '物料名称不能为空', trigger: 'blur' }],
  mType: [{ required: true, message: '物料类型不能为空', trigger: 'change' }],
  unit: [{ required: true, message: '单位不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }],
}

const dialogTitle = ref('新增物料')

const getList = async () => {
  loading.value = true
  try {
    const res = await getMaterialList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      searchKey: searchForm.searchKey,
      searchStatus: searchForm.searchStatus,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取物料列表失败:', error)
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
  dialogTitle.value = type === 'add' ? '新增物料' : '编辑物料'
  dialogVisible.value = true

  if (type === 'add') {
    formData.mName = ''
    formData.mType = ''
    formData.unit = ''
    formData.shelfLife = 365
    formData.specDesc = ''
    formData.status = 1
  }
}

const handleEdit = (row: Material) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑物料'
  dialogVisible.value = true

  formData.mId = row.mid
  formData.mCode = row.mcode
  formData.mName = row.mname
  formData.mType = String(row.mType ?? row.mtype ?? '')
  formData.unit = row.unit
  formData.shelfLife = row.shelfLife || 365
  formData.specDesc = row.specDesc || ''
  formData.status = row.status
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (dialogType.value === 'add') {
        await addMaterial(formData)
        ElMessage.success('新增成功')
      } else {
        await updateMaterial(formData.mId!, formData)
        ElMessage.success('修改成功')
      }

      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleDelete = (row: Material) => {
  ElMessageBox.confirm(`确定删除物料 "${row.mname}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteMaterial(row.mid)
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
loadMaterialTypeDict()
loadUnitTypeDict()
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
