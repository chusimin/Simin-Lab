// @vitest-environment jsdom
/** Frame interactions with a real store and explicitly driven browser measurements. */
import type { GlobalStandardProps, RenderOpts } from '@deepseek-ai/dsh-client-ui-slots'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { AppFrame } from '../src/client/AppFrame.tsx'
import type { AppFrameProps } from '../src/client/AppFrame.tsx'
import type { MainPanelId, RightbarOwnerProps, SidebarOwnerProps } from '../src/client/index.ts'
import { createLayoutStore } from '../src/client/stores.ts'
import type { WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

const useResource = (() => ({ status: 'none' as const, value: undefined, failure: undefined })) as GlobalStandardProps['useResource']
let selectedSession: SessionId | undefined
let selectedSessionTitle: string | undefined
const workspacesReady = true
type AttentionSnapshot = Parameters<Parameters<AppFrameProps['useSessionStatus']>[0]>[0]
const noAttention: AttentionSnapshot = new Map()
const useSessionStatus: AppFrameProps['useSessionStatus'] = selector => selector(noAttention)

let observers: ResizeObserverStub[]
class ResizeObserverStub {
  disconnected = false
  constructor(private callback: ResizeObserverCallback) { observers.push(this) }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void { this.disconnected = true }
  fire(): void { this.callback([], this) }
}

let frameWidth: number
let animationFrames: Map<number, FrameRequestCallback>
let nextFrame: number
let originalTitle: string

/** Flush one browser frame without depending on the worker's timer cadence. */
function flushFrames(): void {
  for (const [id, callback] of [...animationFrames]) {
    if (!animationFrames.delete(id)) continue
    callback(0)
  }
}

function resize(width: number): void {
  frameWidth = width
  act(() => {
    for (const observer of observers) if (!observer.disconnected) observer.fire()
    flushFrames()
  })
}

function mountFrame(windowWidth = frameWidth) {
  vi.stubGlobal('innerWidth', windowWidth)
  const instance = createLayoutStore().create()
  const slotCalls: { key: string; props: object; options: RenderOpts | undefined }[] = []
  const renderSlot: AppFrameProps['renderSlot'] = (key, owner, options) => {
    slotCalls.push({ key, props: owner, options })
    return <div data-testid={`${key}-content`} data-entry-key={options?.entryKey} />
  }
  const useSessions: AppFrameProps['useSessions'] = sel => sel({
    ids: selectedSession === undefined ? [] : [selectedSession],
    byId: selectedSession === undefined ? {} : {
      [selectedSession]: {
        id: selectedSession, displayTitle: 'Test', running: false, retainedBy: { mainView: 1 }, blank: false, updatedAt: 1,
        ...(selectedSessionTitle === undefined ? {} : { title: selectedSessionTitle }),
      },
    },
    phase: 'ready',
    projectionsBySession: {},
  })
  const workspaceState: WorkspaceSnapshot = {
    items: [], archivedSessionIds: [], pinnedSessionIds: [], state: 'idle', phase: 'ready', error: null,
    ...(workspacesReady ? {} : { state: 'loading' as const, phase: 'pending' as const }),
  }
  const useStore = bindSnapshotSelector(instance)
  const usePanelInfo = bindSnapshotSelector({
    getSnapshot: () => instance.getSnapshot().panelInfo,
    subscribe: listener => instance.subscribe(listener),
  })
  const element = () => (
    <AppFrame
      useStore={useStore}
      actions={instance.actions}
      renderSlot={renderSlot}
      useSessions={useSessions}
      usePanelInfo={usePanelInfo}
      useSessionStatus={useSessionStatus}
      useSessionRetainInfo={() => undefined}
      useResource={useResource}
      useWorkspaces={sel => sel(workspaceState)}
      t={key => key === 'brand.localBuild' ? 'DSH Local Build' : key}
    />
  )
  const utils = render(element())
  const frame = utils.container.firstElementChild as HTMLElement
  return {
    ...utils, instance, frame, slotCalls,
    rerenderFrame: () => { utils.rerender(element()) },
    rightOwner: () => slotCalls.findLast(c => c.key === 'rightbar')!.props as RightbarOwnerProps,
    sidebarOwner: () => slotCalls.findLast(c => c.key === 'sidebar')!.props as SidebarOwnerProps,
  }
}

beforeEach(() => {
  localStorage.clear()
  frameWidth = 1280
  animationFrames = new Map()
  nextFrame = 0
  observers = []
  originalTitle = document.title
  selectedSession = undefined
  selectedSessionTitle = undefined
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { const id = ++nextFrame; animationFrames.set(id, callback); return id })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { animationFrames.delete(id) })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: frameWidth, height: 820, x: 0, y: 0, top: 0, left: 0, right: frameWidth, bottom: 820, toJSON: () => ({}) }))
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ root: '/projects', projects: [], trash: [], proposals: [] }) })))
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.title = originalTitle
})

describe('Simin AppFrame', () => {
  it('mounts one workbench over the existing conversation and preserves the native settings host', () => {
    const b = mountFrame()
    expect(b.frame.style.gridTemplateColumns).toBe('minmax(0px, 1fr)')
    expect(b.frame.querySelector('[data-simin-page]')).not.toBeNull()
    expect(b.slotCalls.find(call => call.key === 'main')?.options?.entryKey).toBe('conversation')
    expect(b.sidebarOwner()).toEqual({ collapsed: false, width: 220 })
    expect(b.getByTestId('sidebar-content').parentElement?.className).toContain('nativeHost')
    expect(b.frame.querySelector('[data-shell-leading]')).toBeNull()
    expect(b.slotCalls.some(call => call.key === 'shell.leading')).toBe(false)
  })
  it('keeps frame-wide overlays and bottom content available', () => {
    const b = mountFrame()
    expect(b.frame.querySelector('[data-shell-overlay]')?.contains(b.getByTestId('shell.overlay-content'))).toBe(true)
    expect(b.frame.querySelector('[data-shell-bottom]')?.contains(b.getByTestId('shell.bottom-content'))).toBe(true)
  })
  it('switches registered main panels without replacing the shell', () => {
    const b = mountFrame()
    const shell = b.frame.querySelector('[data-simin-page]')
    act(() => { b.instance.actions.selectPanel('plugins' as MainPanelId) })
    expect(b.slotCalls.findLast(call => call.key === 'main')?.options?.entryKey).toBe('plugins')
    expect(b.frame.querySelector('[data-simin-page]')).toBe(shell)
  })
  it('sizes the preserved Agent detail panel from the measured frame', () => {
    const b = mountFrame()
    expect(b.rightOwner()).toMatchObject({ viewportWidth: 1280, canShow: true })
    resize(600)
    expect(b.rightOwner()).toMatchObject({ viewportWidth: 600, canShow: false })
  })
  it('keeps the last positive width during a hidden window measurement', () => {
    const b = mountFrame()
    resize(0)
    expect(b.instance.getSnapshot().layoutInfo.viewportWidth).toBe(1280)
  })
  it('throttles repeated observer callbacks and releases observers on unmount', () => {
    const b = mountFrame()
    act(() => { observers[0]?.fire(); observers[0]?.fire() })
    expect(animationFrames.size).toBe(1)
    b.unmount()
    expect(observers[0]?.disconnected).toBe(true)
    expect(animationFrames.size).toBe(0)
  })
})
