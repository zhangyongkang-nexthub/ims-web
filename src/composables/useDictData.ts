import { getDictDataList, type DictData } from '@/api/dict'
import type { DictTypeCode } from '@/constants/dict'
import { ref } from 'vue'

/**
 * 通用字典数据 composable
 *
 * 用法：
 * ```ts
 * const { options, labelMap, load, getLabel } = useDictData(DICT_TYPE.PROCESS_TYPE)
 *
 * onMounted(() => load())
 *
 * // 模板中下拉框
 * <el-option v-for="item in options" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
 *
 * // 表格中翻译
 * {{ getLabel(row.processType) }}
 * ```
 */
export function useDictData(dictType: DictTypeCode) {
  const options = ref<DictData[]>([])
  const labelMap = ref<Record<string, string>>({})

  const load = async () => {
    try {
      const res = await getDictDataList(dictType)
      const list = res.data as DictData[]
      options.value = list
      labelMap.value = Object.fromEntries(list.map((d) => [d.dictValue, d.dictLabel]))
    } catch (error) {
      console.error(`加载字典数据 [${dictType}] 失败:`, error)
    }
  }

  /** 将 dictValue 翻译为 dictLabel，未命中时返回原值 */
  const getLabel = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return ''
    return labelMap.value[String(value)] ?? String(value)
  }

  return { options, labelMap, load, getLabel }
}
