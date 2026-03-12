<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <div class="card-header-left">
            <span>字典数据管理</span>
            <el-tag type="info" class="dict-type-tag">{{ dictType }}</el-tag>
          </div>
          <div>
            <el-button type="primary" @click="openDialog('add')">新增字典数据</el-button>
            <el-button @click="goBack">返回</el-button>
          </div>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="dictLabel" label="显示标签" min-width="140" />
        <el-table-column prop="dictValue" label="键值" width="100" />
        <el-table-column prop="dictSort" label="排序号" width="80" />
        <el-table-column prop="isDefault" label="是否默认" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isDefault ? 'success' : 'info'" size="small">
              {{ scope.row.isDefault ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status ? 'success' : 'danger'" size="small">
              {{ scope.row.status ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
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
        <el-form-item label="显示标签" prop="dictLabel">
          <el-input v-model="formData.dictLabel" placeholder="如：生产中" />
        </el-form-item>
        <el-form-item label="键值" prop="dictValue">
          <el-input v-model="formData.dictValue" placeholder="如：2" />
        </el-form-item>
        <el-form-item label="排序号" prop="dictSort">
          <el-input-number v-model="formData.dictSort" :min="0" />
        </el-form-item>
        <el-form-item label="是否默认" prop="isDefault">
          <el-switch v-model="formData.isDefault" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
  addDictData,
  deleteDictData,
  getDictDataList,
  updateDictData,
  type DictData,
  type DictDataForm,
} from '@/api/dict'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const dictType = route.params.dictType as string

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<DictData[]>([])

const formData = reactive<DictDataForm>({
  dictType: dictType,
  dictLabel: '',
  dictValue: '',
  dictSort: 0,
  isDefault: false,
  status: true,
  remark: '',
})

const rules = {
  dictLabel: [{ required: true, message: '显示标签不能为空', trigger: 'blur' }],
  dictValue: [{ required: true, message: '键值不能为空', trigger: 'blur' }],
  dictSort: [{ required: true, message: '排序号不能为空', trigger: 'blur' }],
}

const dialogTitle = ref('新增字典数据')

const getList = async () => {
  loading.value = true
  try {
    const res = await getDictDataList(dictType)
    tableData.value = res.data
  } catch (error) {
    console.error('获取字典数据列表失败:', error)
  } finally {
    loading.value = false
  }
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增字典数据' : '编辑字典数据'
  dialogVisible.value = true

  if (type === 'add') {
    formData.id = undefined
    formData.dictLabel = ''
    formData.dictValue = ''
    formData.dictSort = 0
    formData.isDefault = false
    formData.status = true
    formData.remark = ''
  }
}

const handleEdit = (row: DictData) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑字典数据'
  dialogVisible.value = true

  formData.id = row.id
  formData.dictType = row.dictType
  formData.dictLabel = row.dictLabel
  formData.dictValue = row.dictValue
  formData.dictSort = row.dictSort
  formData.isDefault = row.isDefault
  formData.status = row.status
  formData.remark = row.remark || ''
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (dialogType.value === 'add') {
        await addDictData(formData)
        ElMessage.success('新增成功')
      } else {
        await updateDictData(formData.id!, formData)
        ElMessage.success('修改成功')
      }

      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleDelete = (row: DictData) => {
  ElMessageBox.confirm(`确定删除字典数据 "${row.dictLabel}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteDictData(row.id)
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

const goBack = () => {
  router.back()
}

onMounted(() => {
  getList()
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

.card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dict-type-tag {
  font-family: monospace;
}

.dialog-footer {
  text-align: right;
}
</style>
