/**
 * 个人 AIPM 工作台的当前产品。
 * 与 ui-sidebar 的同名模块保持同一存储约定。两个插件包不能互相引用，所以各放一份。
 */

/** 与 ui-sidebar 的产品栏共用，改动时两边一起改。 */
export const AIPM_STORAGE_KEY = 'aipm.product.v1'

/** 与 ui-sidebar 的产品栏共用。 */
export const AIPM_CHANGE_EVENT = 'aipm-product-change'

/** 还没起名时使用的产品名，也是磁盘目录名。 */
export const AIPM_DEFAULT_PRODUCT_NAME = '未命名产品'

/** 右侧阶段栏固定宽度，AppFrame 用它给中间对话留出位置。 */
export const AIPM_STAGE_WIDTH = 300

/** 当前产品在界面上需要记住的状态。产出物文件名以磁盘为准。 */
export interface AipmProductState {
  /** 产品名，对应 `projects/<名称>/`。 */
  name: string
  /** 当前阶段标题。Skill 未接入时为 null，界面不写死阶段名。 */
  stageTitle: string | null
  /** 还没补上的证据。清空之前不能确认本阶段。 */
  evidenceGaps: readonly string[]
  /** 已经落到产品目录的 Markdown 文件名。 */
  outputs: readonly string[]
}

/** 没有存档时的产品。
 * @returns product state.
 */
export function emptyAipmProduct(): AipmProductState {
  return {
    name: AIPM_DEFAULT_PRODUCT_NAME,
    stageTitle: null,
    evidenceGaps: [],
    outputs: [],
  }
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

/** 读出当前产品。坏数据时回到默认产品，避免把界面卡死。
 * @returns product state.
 */
export function loadAipmProduct(): AipmProductState {
  try {
    const raw = localStorage.getItem(AIPM_STORAGE_KEY)
    if (raw === null) return emptyAipmProduct()
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return emptyAipmProduct()
    const record = parsed as Record<string, unknown>
    const name = typeof record.name === 'string' && record.name.trim() !== ''
      ? record.name.trim()
      : AIPM_DEFAULT_PRODUCT_NAME
    const stageTitle = typeof record.stageTitle === 'string' && record.stageTitle.trim() !== ''
      ? record.stageTitle.trim()
      : null
    return {
      name,
      stageTitle,
      evidenceGaps: isStringList(record.evidenceGaps) ? record.evidenceGaps : [],
      outputs: isStringList(record.outputs) ? record.outputs : [],
    }
  } catch (error: unknown) {
    // Invalid local data returns the first-use state.
    void error
    return emptyAipmProduct()
  }
}

/** 写入当前产品，并通知另一栏刷新。
 * @param next - product state to persist.
 */
export function saveAipmProduct(next: AipmProductState): void {
  localStorage.setItem(AIPM_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(AIPM_CHANGE_EVENT))
}
