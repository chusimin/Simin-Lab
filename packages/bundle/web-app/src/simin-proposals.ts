/** Project-scoped write previews on the existing tool pipeline; no agent-loop changes. */
import { readFile, readdir, writeFile, rename } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { ToolExecution, PreToolDecision } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-system-prompt'
import { SiminFileError, SiminFiles, siminIsDocument } from './simin-files.ts'

/** Persisted proposal; an interrupted tool can be explicitly saved from its retained preview. */
export interface SiminProposal {
  id: string
  project: string
  file: string
  sessionId: string
  createdAt: number
  before: string | null
  after: string
  version: string | null
  status: 'pending' | 'approved' | 'saved' | 'rejected' | 'interrupted' | 'failed'
}
function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new SiminFileError('invalidData')
  return value as Record<string, unknown>
}
function parse(value: unknown): SiminProposal {
  const data = object(value)
  if (typeof data.id !== 'string' || !/^[a-f0-9-]{36}$/u.test(data.id)
    || typeof data.project !== 'string' || typeof data.file !== 'string' || typeof data.sessionId !== 'string'
    || typeof data.createdAt !== 'number' || typeof data.after !== 'string'
    || (data.before !== null && typeof data.before !== 'string') || (data.version !== null && typeof data.version !== 'string')
    || (data.status !== 'pending' && data.status !== 'approved' && data.status !== 'saved'
      && data.status !== 'rejected' && data.status !== 'interrupted' && data.status !== 'failed')) throw new SiminFileError('invalidData')
  return { id: data.id, project: data.project, file: data.file, sessionId: data.sessionId,
    createdAt: data.createdAt, after: data.after, before: data.before, version: data.version, status: data.status }
}

/** Owns pending decisions and their on-disk previews. */
export class SiminProposals {
  private closing = false
  private waiting = new Map<string, { decide: (allow: boolean) => void; signal: AbortSignal }>()
  private calls = new Map<object, SiminProposal>()
  private writes = new Map<string, Promise<void>>()
  private deciding = new Set<string>()
  /**
   * Initialize the filesystem owner.
   * @param files - project filesystem owner.
   */
  constructor(private readonly files: SiminFiles) {}
  /** Project root used to scope the pipeline policy. */
  get root(): string { return this.files.root }
  private async persist(item: SiminProposal): Promise<void> {
    const json = JSON.stringify(item)
    const previous = this.writes.get(item.id) ?? Promise.resolve()
    const write = previous.catch((error: unknown) => { console.warn('Simin proposal persistence:', error) }).then(async () => {
      const dir = await this.files.metadata('proposals')
      const temporary = join(dir, `${item.id}-${randomUUID()}.tmp`)
      await writeFile(temporary, json, { flag: 'wx', mode: 0o600 })
      await rename(temporary, join(dir, `${item.id}.json`))
    })
    this.writes.set(item.id, write)
    try { await write } finally { if (this.writes.get(item.id) === write) this.writes.delete(item.id) }
  }
  /**
   * List retained proposals and identify interrupted writes.
   * @returns retained proposals; abandoned pending writes are marked interrupted.
   */
  async list(): Promise<SiminProposal[]> {
    const dir = await this.files.metadata('proposals')
    const items: SiminProposal[] = []
    for (const name of await readdir(dir)) {
      if (!/^[a-f0-9-]{36}\.json$/u.test(name)) continue
      const item = parse(JSON.parse(await readFile(join(dir, name), 'utf8')))
      if ((item.status === 'pending' || item.status === 'approved') && !this.waiting.has(item.id) && ![...this.calls.values()].some(call => call.id === item.id)) item.status = 'interrupted'
      items.push(item)
    }
    return items.sort((a, b) => b.createdAt - a.createdAt).slice(0, 60)
  }
  /**
   * Apply the user decision to a retained proposal.
   * @param id - proposal identity.
   * @param allow - user's explicit decision.
   */
  async decide(id: string, allow: boolean): Promise<void> {
    if (this.deciding.has(id)) throw new SiminFileError('conflict', 409)
    this.deciding.add(id)
    try { await this.applyDecision(id, allow) } finally { this.deciding.delete(id) }
  }
  private async applyDecision(id: string, allow: boolean): Promise<void> {
    const item = (await this.list()).find(proposal => proposal.id === id)
    if (item === undefined || !['pending', 'interrupted', 'failed'].includes(item.status)) throw new SiminFileError('conflict', 409)
    const pending = this.waiting.get(id)
    if (allow) {
      const current = await this.files.optional(item.project, item.file)
      if ((current?.version ?? null) !== item.version) throw new SiminFileError('conflict', 409)
      if (pending !== undefined) {
        if (pending.signal.aborted) throw new SiminFileError('conflict', 409)
        item.status = 'approved'
        await this.persist(item)
        pending.decide(true)
        return
      }
      await this.files.save(item.project, item.file, item.after, item.version)
    }
    item.status = allow ? 'saved' : 'rejected'
    await this.persist(item)
    pending?.decide(false)
  }
  private project(exec: ToolExecution): { project: string; cwd: string } | undefined {
    const cwd = exec.agent?.session.header.cwd
    if (cwd === undefined || dirname(resolve(cwd)) !== this.files.root) return undefined
    return { project: basename(cwd), cwd }
  }
  /**
   * Preview project document writes before the existing tool executes.
   * @param exec - existing pending tool call.
   * @param next - delegates unrelated calls and approved writes.
   * @returns pipeline decision.
   */
  async gate(exec: ToolExecution, next: () => Promise<PreToolDecision>): Promise<PreToolDecision> {
    const workspace = this.project(exec)
    if (workspace === undefined) return next()
    const denied = (reason: string): PreToolDecision => ({ kind: 'deny', reason })
    if (['bash', 'exec_command', 'apply_patch', 'run_code', 'python', 'cordis_eval'].includes(exec.name)) {
      return denied('Simin 项目的文档需要先预览再确认。请使用 read / write / edit 文件工具，不通过 shell 或脚本修改项目文件。')
    }
    if (!['write', 'edit', 'str_replace_editor'].includes(exec.name)) return next()
    const args = object(exec.arguments)
    if (exec.name === 'str_replace_editor' && args.command === 'view') return next()
    const rawPath = args.file_path ?? args.path
    if (typeof rawPath !== 'string') return denied('请提供文档文件名')
    const path = resolve(workspace.cwd, rawPath)
    if (dirname(path) !== workspace.cwd || !siminIsDocument(basename(path))) return denied('请将独立的 Markdown 或文本文件保存在当前项目目录')
    const file = basename(path)
    const current = await this.files.optional(workspace.project, file)
    let after: string
    if (exec.name === 'write' || args.command === 'create') {
      const content = args.content ?? args.file_text
      if (typeof content !== 'string') return denied('请提供完整文档内容')
      after = content
    } else if (exec.name === 'edit' || args.command === 'str_replace') {
      const oldText = args.old_string ?? args.old_str
      const newText = args.new_string ?? args.new_str
      if (current === null || typeof oldText !== 'string' || !oldText || typeof newText !== 'string') return denied('请先读取文档，再提供准确的修改位置')
      const occurrences = current.markdown.split(oldText).length - 1
      if (occurrences === 0 || (args.replace_all !== true && occurrences !== 1)) return denied('修改位置不存在或不唯一，请重新读取文档')
      after = args.replace_all === true ? current.markdown.split(oldText).join(newText) : current.markdown.replace(oldText, () => newText)
    } else { return denied('请使用 write 或 edit 提交可预览的完整修改') }
    const item: SiminProposal = {
      id: randomUUID(), project: workspace.project, file, sessionId: exec.agent?.session.id ?? '',
      before: current?.markdown ?? null, after, version: current?.version ?? null, createdAt: Date.now(), status: 'pending',
    }
    this.calls.set(exec.token, item)
    let settle: (allow: boolean) => void = () => {}
    const answer = new Promise<boolean>((resolveAnswer) => { settle = resolveAnswer })
    const abort = (): void => { settle(false) }
    this.waiting.set(item.id, { decide: settle, signal: exec.signal })
    exec.signal.addEventListener('abort', abort, { once: true })
    try {
      await this.persist(item)
      if (exec.signal.aborted) settle(false)
      const allow = await answer
      this.waiting.delete(item.id)
      if (!allow) {
        item.status = exec.signal.aborted || this.closing ? 'interrupted' : 'rejected'
        await this.persist(item)
        this.calls.delete(exec.token)
        return exec.signal.aborted || this.closing ? { kind: 'cancel' } : denied('用户取消了保存，文档未修改。请继续讨论，不重复提交相同内容。')
      }
      const latest = await this.files.optional(item.project, item.file)
      if ((latest?.version ?? null) !== item.version) {
        item.status = 'failed'
        await this.persist(item)
        this.calls.delete(exec.token)
        return denied('文档已变化，请重新读取并提出修改')
      }
      item.status = 'approved'
      return await next()
    } catch (error: unknown) {
      item.status = 'failed'
      this.calls.delete(exec.token)
      await this.persist(item)
      throw error
    } finally { exec.signal.removeEventListener('abort', abort); this.waiting.delete(item.id) }
  }
  /**
   * Record the final outcome of the existing write tool.
   * @param exec - settled call.
   * @param failed - whether the original tool failed.
   */
  async settled(exec: ToolExecution, failed: boolean): Promise<void> {
    const item = this.calls.get(exec.token)
    if (item === undefined) return
    this.calls.delete(exec.token)
    item.status = failed ? 'failed' : 'saved'
    await this.persist(item)
  }
  /** Release pending waits during plugin disposal. */
  dispose(): void { this.closing = true; for (const pending of this.waiting.values()) pending.decide(false) }
}

/**
 * Install project-scoped preview policy and prompt guidance.
 * @param ctx - bundle plugin context.
 * @param proposals - pending write owner.
 */
export function installSiminProposals(ctx: Context, proposals: SiminProposals): void {
  ctx.inject(['tools'], (runtime) => {
    runtime.on('tools/pre-execute', (exec, next) => proposals.gate(exec, next))
    runtime.on('tools/result', (exec, result) => {
      void proposals.settled(exec, result.isError).catch((error: unknown) => { console.warn('Simin write result:', error) })
    })
    runtime.effect(() => () => { proposals.dispose() }, 'Simin: release pending document decisions')
  })
  ctx.inject(['systemPrompt'], (runtime) => {
    const projects = new WeakMap<object, string>()
    runtime.on('agent/created', ({ agent }) => {
      const cwd = agent.session.header.cwd
      if (cwd !== undefined) projects.set(agent, cwd)
    })
    runtime.systemPrompt.section({
      name: 'app:simin-project', order: runtime.systemPrompt.getSectionOrder('WEB_SURFACE'),
      text: ({ scope }) => {
        const cwd = scope === undefined ? undefined : projects.get(scope)
        if (cwd === undefined || dirname(resolve(cwd)) !== proposals.root) return ''
        return '这是思敏的 Simin 个人 AI PM 工作台，一个项目一条主线。先讨论真实问题，用户提供的信息算证据；没有证据时一起补，不编造结论，不预设 PRD 等阶段。需要沉淀时使用 write 或 edit 将独立 .md 文件保存在当前工作区。系统会展示文档预览和修改差异，等待用户确认后执行。不要通过 shell、脚本或其他工具绕过文档确认，不读写其他项目。取消保存后继续讨论。'
      },
    })
  })
}
