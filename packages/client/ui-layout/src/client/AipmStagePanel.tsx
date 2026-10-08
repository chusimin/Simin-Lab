/**
 * 右侧阶段栏。
 * 阶段做完必须停在这里：证据缺口清空，并且已经有阶段名，才能确认。
 * 确认后把该阶段 Markdown 写到独立产品目录。阶段名由后续 Skill 填入，这里不写死。
 */
import { useEffect, useState } from 'react'
import {
  AIPM_CHANGE_EVENT, loadAipmProduct, saveAipmProduct, type AipmProductState,
} from './aipm-product.ts'
import css from './AipmStagePanel.module.css'
import { siminZh } from './simin-locales.ts'

interface ConfirmResponse {
  outputs?: unknown
}

/**
 * 本阶段状态、证据缺口和确认按钮。
 * @returns 固定在对话右侧的阶段栏。
 */
export function AipmStagePanel() {
  const [product, setProduct] = useState<AipmProductState>(() => loadAipmProduct())
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const refresh = (): void => { setProduct(loadAipmProduct()) }
    window.addEventListener(AIPM_CHANGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(AIPM_CHANGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const hasStage = product.stageTitle !== null
  const gapsClear = product.evidenceGaps.length === 0
  const canConfirm = hasStage && gapsClear && !pending

  const confirm = (): void => {
    if (!canConfirm || product.stageTitle === null) return
    setPending(true)
    setError(null)
    const stageTitle = product.stageTitle
    const markdown = [
      `# ${stageTitle}`,
      '',
      `${siminZh.productLabel}：${product.name}`,
      '',
      siminZh.stageSaved,
      '',
    ].join('\n')
    void fetch('/aipm/stage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName: product.name, stageTitle, markdown }),
    }).then(async (response) => {
      if (!response.ok) throw new Error('写入失败')
      const body = await response.json() as ConfirmResponse
      const outputs = Array.isArray(body.outputs) && body.outputs.every(item => typeof item === 'string')
        ? body.outputs
        : loadAipmProduct().outputs
      saveAipmProduct({ ...loadAipmProduct(), outputs })
    }).catch(() => {
      setError(siminZh.io)
    }).finally(() => { setPending(false) })
  }

  return (
    <aside className={css.panel} aria-label={siminZh.stage}>
      <h2 className={css.title}>{siminZh.stage}</h2>
      <p className={css.stage}>{product.stageTitle ?? siminZh.stageUnset}</p>
      {!hasStage && <p className={css.hint}>{siminZh.stageHint}</p>}

      <h3 className={css.subtitle}>{siminZh.evidenceGaps}</h3>
      {product.evidenceGaps.length === 0
        ? <p className={css.hint}>{siminZh.noGaps}</p>
        : (
          <ul className={css.gaps}>
            {product.evidenceGaps.map(gap => <li key={gap}>{gap}</li>)}
          </ul>
        )}

      <button type="button" className={css.confirm} disabled={!canConfirm} onClick={confirm}>
        {pending ? siminZh.stageBusy : siminZh.stageConfirm}
      </button>
      {!gapsClear && <p className={css.hint}>{siminZh.stageBlocked}</p>}
      {error !== null && <p className={css.error}>{error}</p>}
    </aside>
  )
}
