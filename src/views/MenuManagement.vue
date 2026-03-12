<template>
  <div class="menu-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>菜单管理</span>
          <el-button type="primary" @click="handleAdd()">新增菜单</el-button>
        </div>
      </template>

      <!-- 表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        row-key="id"
        :tree-props="{ children: 'children' }"
        v-loading="loading"
      >
        <el-table-column prop="menuName" label="菜单名称" width="200" />
        <el-table-column prop="menuType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.menuType === 'M'" type="warning">目录</el-tag>
            <el-tag v-else-if="row.menuType === 'C'" type="primary">菜单</el-tag>
            <el-tag v-else type="info">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" width="200" />
        <el-table-column prop="component" label="组件路径" width="200" />
        <el-table-column prop="perms" label="权限标识" width="200" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleAdd(row)">新增</el-button>
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="上级菜单">
          <el-tree-select
            v-model="form.parentId"
            :data="menuTreeOptions"
            :props="treeProps"
            check-strictly
            placeholder="请选择上级菜单"
          />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio value="M">目录</el-radio>
            <el-radio value="C">菜单</el-radio>
            <el-radio value="F">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="form.menuName" />
        </el-form-item>
        <el-form-item label="路由路径" v-if="form.menuType !== 'F'">
          <el-input v-model="form.path" />
        </el-form-item>
        <el-form-item label="组件路径" v-if="form.menuType === 'C'">
          <el-input v-model="form.component" />
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input v-model="form.perms" placeholder="如: sys:user:list" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading"> 确定 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { addMenu, deleteMenu, getMenuTree, updateMenu, type Menu, type MenuForm } from '@/api/menu'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<Menu[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<MenuForm>({
  parentId: 0,
  menuName: '',
  path: '',
  component: '',
  perms: '',
  menuType: 'C',
})

const treeProps = {
  children: 'children',
  label: 'menuName',
  value: 'id',
}

const formRules: FormRules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
}

// 菜单树选项（包含根节点）
const menuTreeOptions = computed(() => {
  return [
    {
      id: 0,
      menuName: '根目录',
      children: tableData.value,
    },
  ]
})

// 加载菜单树
const loadMenuTree = async () => {
  loading.value = true
  try {
    const res = await getMenuTree()
    tableData.value = res.data
  } catch (error) {
    console.error('加载菜单树失败:', error)
  } finally {
    loading.value = false
  }
}

// 新增
const handleAdd = (parent?: Menu) => {
  isEdit.value = false
  dialogTitle.value = '新增菜单'
  form.parentId = parent?.id || 0
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Menu) => {
  isEdit.value = true
  dialogTitle.value = '编辑菜单'
  form.id = row.id
  form.parentId = row.parentId
  form.menuName = row.menuName
  form.path = row.path
  form.component = row.component || ''
  form.perms = row.perms || ''
  form.menuType = row.menuType
  dialogVisible.value = true
}

// 删除
const handleDelete = (row: Menu) => {
  ElMessageBox.confirm(`确定要删除菜单 "${row.menuName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteMenu(row.id)
      ElMessage.success('删除成功')
      loadMenuTree()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await updateMenu(form.id!, form)
          ElMessage.success('更新成功')
        } else {
          await addMenu(form)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        loadMenuTree()
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
  form.id = undefined
  form.parentId = 0
  form.menuName = ''
  form.path = ''
  form.component = ''
  form.perms = ''
  form.menuType = 'C'
}

onMounted(() => {
  loadMenuTree()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
