/** `sidebar` namespace dictionaries for shell controls and global panels. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'session.new': '新会话',
  'session.new.label': '新建会话',
  'toggle.open': '打开侧边栏',
  'toggle.collapse': '收起侧边栏',
  'panels.label': '全局面板',
  'product.current': '当前产品',
  'product.name': '产品名称',
  'product.stage': '阶段',
  'product.unconnected': '流程尚未接入',
  'product.outputs': '产出物',
  'product.empty': '确认阶段后出现在这里',
} satisfies Record<string, string>

/** The sidebar namespace key union. */
export type SidebarKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'session.new': 'New Session',
  'session.new.label': 'New session',
  'toggle.open': 'Open sidebar',
  'toggle.collapse': 'Collapse sidebar',
  'panels.label': 'Global panels',
  'product.current': 'Current product',
  'product.name': 'Product name',
  'product.stage': 'Stage',
  'product.unconnected': 'Workflow not connected',
  'product.outputs': 'Documents',
  'product.empty': 'Confirmed stage documents appear here',
} satisfies Record<SidebarKey, string>
