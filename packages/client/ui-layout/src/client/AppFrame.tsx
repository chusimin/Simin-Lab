/**
 * Root frame. SiminShell owns the home and project layout; this frame keeps
 * the viewport measure, overlays, and the existing conversation slot.
 */
import { useLayoutEffect, useMemo, useRef } from 'react'
import type {
  PropsLocale, PropsRenderSlots, PropsRuntime, PropsStore,
} from '@deepseek-ai/dsh-client-ui-slots'
import { DocumentTitle } from './DocumentTitle.tsx'
import { SiminShell } from './SiminShell.tsx'
import { RIGHTBAR_DEFAULT_RATIO } from './columns.ts'
import type { createLayoutStore } from './stores.ts'
import css from './AppFrame.module.css'

/** Full composed props: runtime share + child-slot render share + store share. */
export type AppFrameProps =
  & PropsRuntime<'root'>
  & PropsRenderSlots<'sidebar' | 'main' | 'rightbar' | 'shell.bottom' | 'shell.overlay' | 'shell.leading'>
  & PropsStore<ReturnType<typeof createLayoutStore>>
  & PropsLocale<'simin'>

/** Subscribe to the main key without subscribing the column frame to each panel id. */
function MainPanel({ usePanelInfo, renderSlot }: Pick<PropsRuntime<'root'>, 'usePanelInfo'> & PropsRenderSlots<'main'>) {
  const panelId = usePanelInfo(info => info.activePanelId)
  return renderSlot('main', {}, { entryKey: panelId ?? 'conversation' })
}

/** The Simin frame: project home and the existing conversation live in SiminShell. */
export function AppFrame({
  useStore,
  useSessions,
  usePanelInfo,
  actions,
  renderSlot,
  t,
}: AppFrameProps) {
  const layoutInfo = useStore(state => state.layoutInfo)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const viewport = layoutInfo.viewportWidth

  // Track the frame's own box (not the window): rAF-throttled ResizeObserver.
  useLayoutEffect(() => {
    const el = frameRef.current
    /* v8 ignore next -- the ref is always attached by effect time: the frame div renders unconditionally. */
    if (el === null) return
    let raf: number | null = null
    let disposed = false
    const measure = () => {
      const width = el.getBoundingClientRect().width
      if (width > 0) actions.setViewportWidth(width)
    }
    measure()
    const observer = new ResizeObserver(() => {
      if (disposed) return
      raf ??= requestAnimationFrame(() => {
        raf = null
        measure()
      })
    })
    observer.observe(el)
    return () => {
      disposed = true
      observer.disconnect()
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [actions])

  const productTitle = process.env.DSH_CLIENT_TITLE ?? t('brand.localBuild')
  const main = useMemo(() => (
    <MainPanel usePanelInfo={usePanelInfo} renderSlot={renderSlot} />
  ), [usePanelInfo, renderSlot])
  const overlays = useMemo(() => renderSlot('shell.overlay', {}), [renderSlot])
  const rightWidth = Math.min(layoutInfo.rightbar ?? viewport * RIGHTBAR_DEFAULT_RATIO, Math.max(0, viewport - 290))

  return (
    <div
      ref={frameRef}
      className={css.frame}
      style={{ gridTemplateColumns: 'minmax(0px, 1fr)' }}
    >
      <DocumentTitle
        productTitle={productTitle}
        useSessions={useSessions}
        usePanelInfo={usePanelInfo}
      />
      <SiminShell chat={main} t={t} nativeSettings={renderSlot('sidebar', { collapsed: false, width: 220 })} />
      <div className={css.bottomRow} data-shell-bottom>
        {renderSlot('shell.bottom', {})}
      </div>
      <div className={css.overlayLayer} data-shell-overlay>
        {overlays}
      </div>
      <aside className={css.rightbarFloat} style={{ width: rightWidth }}
        hidden={!layoutInfo.rightbarTrack && !layoutInfo.rightbarFullscreen}>
        {renderSlot('rightbar', { width: rightWidth, viewportWidth: viewport, canShow: viewport >= 640 })}
      </aside>
    </div>
  )
}
