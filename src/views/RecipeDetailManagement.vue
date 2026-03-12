<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>配方明细管理</span>
          <el-button type="primary" @click="openDialog('add')">新增明细</el-button>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="mname" label="物料名称" width="200" />
        <el-table-column prop="standardQty" label="标准数量" width="120" />
        <el-table-column prop="unit" label="单位" width="100">
          <template #default="scope">
            {{ getUnitTypeLabel(scope.row.unit) }}
          </template>
        </el-table-column>
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
        <el-form-item label="物料" prop="mId">
          <el-select v-model="formData.mId" placeholder="选择物料">
            <el-option v-for="m in materialList" :key="m.mid" :label="m.mname" :value="m.mid" />
          </el-select>
        </el-form-item>
        <el-form-item label="标准数量" prop="standardQty">
          <el-input-number v-model="formData.standardQty" :min="0" />
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
  addRecipeDetail,
  deleteRecipeDetail,
  getRecipeDetailList,
  updateRecipeDetail,
  type RecipeDetail,
  type RecipeDetailForm,
} from '@/api/recipe'
import { useDictData } from '@/composables/useDictData'
import { DICT_TYPE } from '@/constants/dict'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const recipeId = Number(route.params.recipeId)

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<RecipeDetail[]>([])
const materialList = ref<Material[]>([])

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

const formData = reactive<RecipeDetailForm>({
  recipeId: recipeId,
  mId: 0,
  standardQty: 0,
  unit: '',
})

const rules = {
  mId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  standardQty: [{ required: true, message: '标准数量不能为空', trigger: 'blur' }],
  unit: [{ required: true, message: '单位不能为空', trigger: 'blur' }],
}

const dialogTitle = ref('新增明细')

const getList = async () => {
  loading.value = true
  try {
    const res = await getRecipeDetailList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      recipeId: recipeId,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取配方明细列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadMaterialList = async () => {
  try {
    const res = await getMaterialList({ pageSize: 1000 })
    materialList.value = res.data.records
  } catch (error) {
    console.error('加载物料列表失败:', error)
  }
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增明细' : '编辑明细'
  dialogVisible.value = true

  if (type === 'add') {
    formData.mId = 0
    formData.standardQty = 0
    formData.unit = ''
  }
}

const handleEdit = (row: RecipeDetail) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑明细'
  dialogVisible.value = true

  formData.detailId = row.detailId
  formData.mId = row.mid
  formData.standardQty = row.standardQty
  formData.unit = row.unit
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (dialogType.value === 'add') {
        await addRecipeDetail(formData)
        ElMessage.success('新增成功')
      } else {
        await updateRecipeDetail(formData.detailId!, formData)
        ElMessage.success('修改成功')
      }

      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleDelete = (row: RecipeDetail) => {
  ElMessageBox.confirm(`确定删除该明细吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteRecipeDetail(row.detailId)
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
  loadMaterialList()
  loadUnitTypeDict()
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

.pagination {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}
</style>
