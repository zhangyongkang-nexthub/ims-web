/**
 * 系统内置字典类型定义（单一数据源）
 *
 * - dictType: 字典编码（全局唯一，对应后端 mes_dict_type.dict_type）
 * - dictName: 字典名称（页面显示用）
 * - remark:   备注说明
 *
 * ★ 前端代码通过 DICT_TYPE.xxx 引用编码
 * ★ 字典类型管理页面自动将此列表同步到后端（缺的自动创建）
 * ★ 用户只需在「字典数据」页面维护每个类型下的具体值
 */

export interface SystemDictType {
  dictType: string
  dictName: string
  remark: string
}

/** 系统内置字典类型列表 —— 新增字典只需在此追加一条 */
export const SYSTEM_DICT_TYPES: SystemDictType[] = [
  {
    dictType: 'process_type',
    dictName: '工序类型',
    remark: '工艺参数明细的工序类型（MIXING / STERILIZING / FILLING …）',
  },
  {
    dictType: 'order_status',
    dictName: '工单状态',
    remark: '工单生命周期状态（待排产 / 待生产 / 生产中 / 已完成 / 已关闭）',
  },
  { dictType: 'device_status', dictName: '设备状态', remark: '设备运行状态' },
  { dictType: 'material_type', dictName: '物料类型', remark: '物料分类' },
  {
    dictType: 'unit_type',
    dictName: '单位类型',
    remark: '统一计量单位（kg / g / L / ml / pcs 等）',
  },
  {
    dictType: 'supplier_type',
    dictName: '供应商类型',
    remark: '供应商分类（原料 / 包材 / 物流等）',
  },
]

/** 内置字典编码集合（用于快速判断是否为系统内置） */
export const SYSTEM_DICT_TYPE_SET = new Set(SYSTEM_DICT_TYPES.map((d) => d.dictType))

/** 字典编码常量 —— 业务页面引用入口 */
export const DICT_TYPE = {
  PROCESS_TYPE: 'process_type',
  ORDER_STATUS: 'order_status',
  DEVICE_STATUS: 'device_status',
  MATERIAL_TYPE: 'material_type',
  UNIT_TYPE: 'unit_type',
  SUPPLIER_TYPE: 'supplier_type',
} as const

/** 字典类型编码的联合类型 */
export type DictTypeCode = (typeof DICT_TYPE)[keyof typeof DICT_TYPE]
