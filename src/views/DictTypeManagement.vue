<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>字典类型管理</span>
          <el-button type="primary" @click="openDialog('add')">新增字典类型</el-button>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="dictName" label="字典名称" min-width="160">
          <template #default="scope">
            {{ scope.row.dictName }}
            <el-tag
              v-if="isBuiltIn(scope.row.dictType)"
              type="warning"
              size="small"
              class="builtin-tag"
            >
              内置
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dictType" label="字典编码" min-width="180">
          <template #default="scope">
            <el-link type="primary" @click="handleDictData(scope.row)">
              {{ scope.row.dictType }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)"
              >编辑</el-button
            >
            <el-button link type="warning" size="small" @click="handleDictData(scope.row)"
              >字典数据</el-button
            >
            <el-button
              link
              type="danger"
              size="small"
              :disabled="isBuiltIn(scope.row.dictType)"
              @click="handleDelete(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
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
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="formData.dictName" placeholder="请输入字典名称，如：工单状态" />
        </el-form-item>
        <el-form-item label="字典编码" prop="dictType">
          <el-input
            v-model="formData.dictType"
            placeholder="请输入字典编码，如：order_status"
            :disabled="dialogType === 'edit'"
          />
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
  addDictType,
  deleteDictType,
  getDictTypeList,
  updateDictType,
  type DictType,
  type DictTypeForm,
} from '@/api/dict'
import { SYSTEM_DICT_TYPES, SYSTEM_DICT_TYPE_SET } from '@/constants/dict'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<DictType[]>([])

const formData = reactive<DictTypeForm>({
  dictName: '',
  dictType: '',
  remark: '',
})

const rules = {
  dictName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
  dictType: [
    { required: true, message: '字典编码不能为空', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]*$/,
      message: '仅允许小写字母、数字和下划线，且以字母开头',
      trigger: 'blur',
    },
  ],
}

const dialogTitle = ref('新增字典类型')

/** 判断是否为系统内置字典类型 */
const isBuiltIn = (dictType: string) => SYSTEM_DICT_TYPE_SET.has(dictType)

/**
 * 自动同步系统内置字典类型
 * 对比后端已有列表与前端定义，缺失的自动创建
 */
const syncSystemDictTypes = async () => {
  try {
    const res = await getDictTypeList()
    const existingCodes = new Set((res.data as DictType[]).map((d) => d.dictType))

    const missing = SYSTEM_DICT_TYPES.filter((d) => !existingCodes.has(d.dictType))
    if (missing.length > 0) {
      await Promise.all(
        missing.map((d) =>
          addDictType({ dictName: d.dictName, dictType: d.dictType, remark: d.remark }),
        ),
      )
      ElMessage.success(`已自动初始化 ${missing.length} 个系统字典类型`)
    }
  } catch (error) {
    console.error('同步系统字典类型失败:', error)
  }
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getDictTypeList()
    tableData.value = res.data
  } catch (error) {
    console.error('获取字典类型列表失败:', error)
  } finally {
    loading.value = false
  }
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增字典类型' : '编辑字典类型'
  dialogVisible.value = true

  if (type === 'add') {
    formData.id = undefined
    formData.dictName = ''
    formData.dictType = ''
    formData.remark = ''
  }
}

const handleEdit = (row: DictType) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑字典类型'
  dialogVisible.value = true

  formData.id = row.id
  formData.dictName = row.dictName
  formData.dictType = row.dictType
  formData.remark = row.remark || ''
}

const handleDictData = (row: DictType) => {
  router.push({
    name: 'DictDataManagement',
    params: { dictType: row.dictType },
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (dialogType.value === 'add') {
        await addDictType(formData)
        ElMessage.success('新增成功')
      } else {
        await updateDictType(formData.id!, formData)
        ElMessage.success('修改成功')
      }

      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleDelete = (row: DictType) => {
  if (isBuiltIn(row.dictType)) {
    ElMessage.warning('系统内置字典类型不允许删除')
    return
  }

  ElMessageBox.confirm(
    `确定删除字典类型 "${row.dictName}" 吗？删除后其下所有字典数据也将失效。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  )
    .then(async () => {
      try {
        await deleteDictType(row.id)
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

onMounted(async () => {
  await syncSystemDictTypes()
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

.builtin-tag {
  margin-left: 6px;
}

.dialog-footer {
  text-align: right;
}
</style>
