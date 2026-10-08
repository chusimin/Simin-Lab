/**
 * 左侧产品栏：一个产品一条主线。
 * 只展示产品名、阶段占位和已经落盘的产出物。阶段名等 Skill 接入后再出现。
 */
import { useEffect, useState } from 'react'
import {
  AIPM_CHANGE_EVENT, AIPM_DEFAULT_PRODUCT_NAME, loadAipmProduct, saveAipmProduct,
  type AipmProductState,
} from './aipm-product.ts'
import css from './AipmProductRail.module.css'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'

/** 向本机服务要这个产品目录里已有的 Markdown。 */
async function loadOutputs(name: string): Promise<readonly string[]> {
  const response = await fetch(`/aipm/product?name=${encodeURIComponent(name)}`)
  if (!response.ok) return []
  const body: unknown = await response.json()
  if (typeof body !== 'object' || body === null) return []
  const outputs = (body as { outputs?: unknown }).outputs
  return Array.isArray(outputs) && outputs.every(item => typeof item === 'string') ? outputs : []
}

/**
 * 当前产品的名称、阶段和产出物。
 * @param props.wide - 侧边栏展开时展示全文，收起时只留产品名首字。
 */
export function AipmProductRail({ wide, t }: { wide: boolean; t: PropsLocale<'sidebar'>['t'] }) {
  const [product, setProduct] = useState<AipmProductState>(() => loadAipmProduct())
  const [draftName, setDraftName] = useState(product.name)

  useEffect(() => {
    const refresh = (): void => {
      const next = loadAipmProduct()
      setProduct(next)
      setDraftName(next.name)
    }
    window.addEventListener(AIPM_CHANGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(AIPM_CHANGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void loadOutputs(product.name).then((outputs) => {
      if (cancelled) return
      const current = loadAipmProduct()
      if (current.name !== product.name) return
      if (current.outputs.join('\n') === outputs.join('\n')) return
      saveAipmProduct({ ...current, outputs })
    }).catch(() => { /* 目录还没建好时左侧保持空列表 */ })
    return () => { cancelled = true }
  }, [product.name])

  const commitName = (): void => {
    const name = draftName.trim() === '' ? AIPM_DEFAULT_PRODUCT_NAME : draftName.trim()
    setDraftName(name)
    if (name === product.name) return
    saveAipmProduct({ ...loadAipmProduct(), name, outputs: [] })
  }

  if (!wide) {
    return <div className={css.mark} title={product.name}>{product.name.slice(0, 1)}</div>
  }

  return (
    <section className={css.rail} aria-label={t('product.current')}>
      <label className={css.field}>
        <span className={css.label}>{t('product.current')}</span>
        <input
          className={css.name}
          value={draftName}
          aria-label={t('product.name')}
          onChange={(event) => { setDraftName(event.target.value) }}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
      </label>

      <div className={css.block}>
        <h2 className={css.label}>{t('product.stage')}</h2>
        {product.stageTitle === null
          ? <p className={css.empty}>{t('product.unconnected')}</p>
          : <p className={css.item}>{product.stageTitle}</p>}
      </div>

      <div className={css.block}>
        <h2 className={css.label}>{t('product.outputs')}</h2>
        {product.outputs.length === 0
          ? <p className={css.empty}>{t('product.empty')}</p>
          : (
            <ul className={css.list}>
              {product.outputs.map(fileName => <li key={fileName} className={css.item}>{fileName}</li>)}
            </ul>
          )}
      </div>
    </section>
  )
}
