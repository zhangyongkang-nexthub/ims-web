<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>工艺方案管理</span>
          <el-button type="primary" @click="openDialog('add')">新增工艺方案</el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <div class="search-form">
        <el-input
          v-model="searchForm.searchKey"
          placeholder="搜索工艺名称"
          clearable
          class="search-input"
        />
        <el-select
          v-model="searchForm.productId"
          placeholder="选择产品"
          clearable
          class="search-select"
          filterable
        >
          <el-option v-for="p in productList" :key="p.pid" :label="p.pname" :value="p.pid" />
        </el-select>
        <el-select
          v-model="searchForm.isDefault"
          placeholder="是否默认"
          clearable
          class="search-select"
        >
          <el-option label="是" :value="true" />
          <el-option label="否" :value="false" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="recipeName" label="工艺名称" min-width="180" />
        <el-table-column prop="productName" label="关联产品" width="160" />
        <el-table-column prop="isDefaultLabel" label="是否默认" width="100" />
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)"
              >编辑</el-button
            >
            <el-button link type="warning" size="small" @click="handleCraftDetail(scope.row)"
              >参数明细</el-button
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
        <el-form-item label="工艺名称" prop="recipeName">
          <el-input v-model="formData.recipeName" placeholder="请输入工艺名称" />
        </el-form-item>
        <el-form-item label="关联产品" prop="productId">
          <el-select v-model="formData.productId" placeholder="选择产品" filterable>
            <el-option v-for="p in productList" :key="p.pid" :label="p.pname" :value="p.pid" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否默认" prop="isDefault">
          <el-switch v-model="formData.isDefault" />
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
  addCraft,
  deleteCraft,
  getCraftList,
  updateCraft,
  type Craft,
  type CraftForm,
} from '@/api/craft'
import { getProductList, type Product } from '@/api/product'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<Craft[]>([])
const productList = ref<Product[]>([])

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive<{
  searchKey: string
  productId: number | undefined
  isDefault: boolean | undefined
}>({
  searchKey: '',
  productId: undefined,
  isDefault: undefined,
})

const formData = reactive<CraftForm>({
  productId: 0,
  recipeName: '',
  isDefault: false,
  remark: '',
})

const rules = {
  recipeName: [{ required: true, message: '工艺名称不能为空', trigger: 'blur' }],
  productId: [{ required: true, message: '关联产品不能为空', trigger: 'change' }],
}

const dialogTitle = ref('新增工艺方案')

const getList = async () => {
  loading.value = true
  try {
    const res = await getCraftList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      searchKey: searchForm.searchKey,
      productId: searchForm.productId,
      isDefault: searchForm.isDefault,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取工艺方案列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadProductList = async () => {
  try {
    const res = await getProductList({ pageSize: 1000 })
    productList.value = res.data.records
  } catch (error) {
    console.error('加载产品列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}

const handleReset = () => {
  searchForm.searchKey = ''
  searchForm.productId = undefined
  searchForm.isDefault = undefined
  pagination.pageNum = 1
  getList()
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增工艺方案' : '编辑工艺方案'
  dialogVisible.value = true

  if (type === 'add') {
    formData.id = undefined
    formData.recipeName = ''
    formData.productId = 0
    formData.isDefault = false
    formData.remark = ''
  }
}

const handleEdit = (row: Craft) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑工艺方案'
  dialogVisible.value = true

  formData.id = row.id
  formData.recipeName = row.recipeName
  formData.productId = row.productId
  formData.isDefault = row.isDefault
  formData.remark = row.remark || ''
}

const handleCraftDetail = (row: Craft) => {
  router.push({
    name: 'CraftDetailManagement',
    params: { craftId: row.id },
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (dialogType.value === 'add') {
        await addCraft(formData)
        ElMessage.success('新增成功')
      } else {
        await updateCraft(formData.id!, formData)
        ElMessage.success('修改成功')
      }

      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleDelete = (row: Craft) => {
  ElMessageBox.confirm(`确定删除工艺方案 "${row.recipeName}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteCraft(row.id)
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
  loadProductList()
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
