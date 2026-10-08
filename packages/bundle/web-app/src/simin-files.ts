/** Local project documents, versioned mutations, and recoverable trash for Simin. */
import { constants } from 'node:fs'
import { open, mkdir, readdir, lstat, writeFile, rename, unlink, link } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { join, resolve } from 'node:path'

/** A refused file operation; codes are consumed by the localized desktop client. */
export class SiminFileError extends Error {
  /**
   * Describe a refused filesystem operation.
   * @param code - stable client error code.
   * @param status - HTTP response status.
   */
  constructor(readonly code: string, readonly status = 400) { super(code) }
}
/** A document's disk metadata and a short content preview. */
export interface SiminFile { name: string; modifiedAt: number; bytes: number; preview: string }
/** One real project directory. */
export interface SiminProject { name: string; path: string; documents: string[]; files: SiminFile[] }
/** Deleted file metadata retained beside its content. */
export interface SiminTrash { id: string; project: string; file: string; deletedAt: number; version: string; markdown: string }
/** Current UTF-8 content with its optimistic mutation token. */
export interface SiminDocument { markdown: string; version: string }

/**
 * Validate one visible project or document name.
 * @param value - one path component.
 * @returns the trimmed, validated name.
 */
export function siminSegment(value: unknown): string {
  if (typeof value !== 'string') throw new SiminFileError('invalidName')
  const name = value.trim()
  if (!name || name.length > 120 || name.startsWith('.') || /[\\/\x00-\x1f:]/u.test(name)) throw new SiminFileError('invalidName')
  return name
}
/**
 * Identify the supported document extensions.
 * @param name - filename.
 * @returns whether the workbench displays this text file.
 */
export function siminIsDocument(name: string): boolean { return /\.(md|txt)$/iu.test(name) }
/**
 * Hash the current UTF-8 document content.
 * @param text - current text.
 * @returns a content token.
 */
export function siminVersion(text: string): string { return createHash('sha256').update(text).digest('hex') }
function documentName(value: unknown): string {
  const name = siminSegment(value)
  if (!siminIsDocument(name)) throw new SiminFileError('invalidFile')
  return name
}
function missing(error: unknown): boolean { return error instanceof Error && 'code' in error && error.code === 'ENOENT' }
function exists(error: unknown): boolean { return error instanceof Error && 'code' in error && error.code === 'EEXIST' }
async function regularText(path: string): Promise<string> {
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const info = await file.stat()
    if (!info.isFile() || info.size > 2_000_000) throw new SiminFileError('unsupportedFile')
    const text = await file.readFile('utf8')
    if (text.includes('\0')) throw new SiminFileError('unsupportedFile')
    return text
  } finally { await file.close() }
}
function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new SiminFileError('invalidData')
  return value as Record<string, unknown>
}
function trashRecord(value: unknown): Omit<SiminTrash, 'markdown'> {
  const data = record(value)
  if (typeof data.id !== 'string' || !/^[a-f0-9-]{36}$/u.test(data.id)
    || typeof data.deletedAt !== 'number' || typeof data.version !== 'string') throw new SiminFileError('invalidData')
  return { id: data.id, project: siminSegment(data.project), file: documentName(data.file),
    deletedAt: data.deletedAt, version: data.version }
}

/** Disk owner. Serializes its mutations; external edits are checked against content tokens. */
export class SiminFiles {
  private tail: Promise<void> = Promise.resolve()
  /**
   * Initialize the filesystem owner.
   * @param root - absolute project root; existing project directories stay in place.
   */
  constructor(readonly root: string) { if (!root || resolve(root) !== root) throw new SiminFileError('invalidRoot') }
  private async directory(project: string): Promise<string> {
    const path = join(this.root, siminSegment(project))
    const info = await lstat(path)
    if (!info.isDirectory() || info.isSymbolicLink()) throw new SiminFileError('invalidProject')
    return path
  }
  private async internal(folder: string): Promise<string> {
    await mkdir(this.root, { recursive: true })
    const metadata = join(this.root, '.simin')
    await mkdir(metadata, { recursive: true, mode: 0o700 })
    if ((await lstat(metadata)).isSymbolicLink()) throw new SiminFileError('invalidData')
    const path = join(metadata, folder)
    await mkdir(path, { recursive: true, mode: 0o700 })
    if ((await lstat(path)).isSymbolicLink()) throw new SiminFileError('invalidData')
    return path
  }
  private mutate<T>(action: () => Promise<T>): Promise<T> {
    const next = this.tail.then(action)
    this.tail = next.then(() => {}, () => {})
    return next
  }
  /**
   * List actual project directories and readable documents.
   * @returns real project rows and previews; hidden metadata and links are excluded.
   */
  async projects(): Promise<SiminProject[]> {
    await mkdir(this.root, { recursive: true })
    const entries = await readdir(this.root, { withFileTypes: true })
    return Promise.all(entries.filter(item => item.isDirectory() && !item.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh')).map(async (item) => {
        const path = await this.directory(item.name)
        const names = (await readdir(path, { withFileTypes: true })).filter(file => file.isFile() && siminIsDocument(file.name))
          .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
        const files = await Promise.all(names.map(async (file) => {
          const target = join(path, file.name)
          const info = await lstat(target)
          let preview = ''
          if (info.size <= 2_000_000) preview = (await regularText(target)).slice(0, 320).replace(/[#*`>]/gu, '').trim()
          return { name: file.name, bytes: info.size, modifiedAt: info.mtimeMs, preview }
        }))
        return { name: item.name, path, documents: names.map(file => file.name), files }
      }))
  }
  /**
   * Create an empty project directory without replacing an existing one.
   * @param name - desired directory name.
   * @returns a new, empty project; duplicates refuse.
   */
  async create(name: unknown): Promise<SiminProject> {
    const project = siminSegment(name)
    await mkdir(this.root, { recursive: true })
    const path = join(this.root, project)
    try { await mkdir(path) } catch (error: unknown) { if (exists(error)) throw new SiminFileError('duplicate', 409); throw error }
    return { name: project, path, documents: [], files: [] }
  }
  /**
   * Read a regular document and its content version.
   * @param project - directory name.
   * @param file - document name.
   * @returns guarded regular-file content.
   */
  async read(project: string, file: string): Promise<SiminDocument> {
    const markdown = await regularText(join(await this.directory(project), documentName(file)))
    return { markdown, version: siminVersion(markdown) }
  }
  /**
   * Read a document when it exists.
   * @param project - directory name.
   * @param file - document name.
   * @returns content, or null only for absence.
   */
  async optional(project: string, file: string): Promise<SiminDocument | null> {
    try { return await this.read(project, file) } catch (error: unknown) { if (missing(error)) return null; throw error }
  }
  private async checked(project: string, file: string, version: unknown): Promise<SiminDocument | null> {
    const current = await this.optional(project, file)
    if ((current?.version ?? null) !== version) throw new SiminFileError('conflict', 409)
    return current
  }
  /**
   * Save content only while the observed version still matches.
   * @param project - directory name.
   * @param file - target.
   * @param markdown - proposed text.
   * @param version - observed token, null for creation.
   * @returns saved content token.
   */
  save(project: string, file: string, markdown: string, version: unknown): Promise<SiminDocument> {
    return this.mutate(async () => {
      if (Buffer.byteLength(markdown) > 2_000_000) throw new SiminFileError('unsupportedFile')
      const current = await this.checked(project, file, version)
      const path = join(await this.directory(project), documentName(file))
      const temporary = join(await this.directory(project), `.simin-${randomUUID()}.tmp`)
      await writeFile(temporary, markdown, { flag: 'wx', mode: 0o600 })
      try {
        await this.checked(project, file, version)
        if (current === null) {
          try { await link(temporary, path) } catch (error: unknown) { if (exists(error)) throw new SiminFileError('conflict', 409); throw error }
        } else { await rename(temporary, path) }
      } finally {
        try { await unlink(temporary) } catch (error: unknown) { if (!missing(error)) throw error }
      }
      return { markdown, version: siminVersion(markdown) }
    })
  }
  /**
   * Rename a document without replacing an existing destination.
   * @param project - directory.
   * @param file - current file.
   * @param next - new name.
   * @param version - observed content token.
   */
  rename(project: string, file: string, next: string, version: unknown): Promise<void> {
    return this.mutate(async () => {
      await this.checked(project, file, version)
      const path = await this.directory(project)
      const source = join(path, documentName(file))
      const target = join(path, documentName(next))
      if (source === target) return
      try { await link(source, target) } catch (error: unknown) { if (exists(error)) throw new SiminFileError('duplicate', 409); throw error }
      await unlink(source)
    })
  }
  /**
   * Retain a document in recoverable trash.
   * @param project - directory.
   * @param file - document.
   * @param version - observed content token.
   * @returns trash identity.
   */
  trash(project: string, file: string, version: unknown): Promise<string> {
    return this.mutate(async () => {
      const current = await this.checked(project, file, version)
      if (current === null) throw new SiminFileError('missing', 404)
      const id = randomUUID()
      const dir = await this.internal('trash')
      const meta = { id, project: siminSegment(project), file: documentName(file), deletedAt: Date.now(), version: current.version }
      await writeFile(join(dir, `${id}.json`), JSON.stringify(meta), { flag: 'wx', mode: 0o600 })
      try { await rename(join(await this.directory(project), meta.file), join(dir, `${id}.txt`)) }
      catch (error: unknown) { await unlink(join(dir, `${id}.json`)); throw error }
      return id
    })
  }
  /**
   * List recoverable documents with their retained contents.
   * @returns deleted documents with their actual retained content.
   */
  async trashList(): Promise<SiminTrash[]> {
    const dir = await this.internal('trash')
    const rows: SiminTrash[] = []
    for (const file of await readdir(dir)) {
      if (!/^[a-f0-9-]{36}\.json$/u.test(file)) continue
      const meta = trashRecord(JSON.parse(await regularText(join(dir, file))))
      try {
        const markdown = await regularText(join(dir, `${meta.id}.txt`))
        rows.push({ ...meta, markdown, version: siminVersion(markdown) })
      } catch (error: unknown) { if (!missing(error)) throw error }
    }
    return rows.sort((a, b) => b.deletedAt - a.deletedAt)
  }
  /**
   * Restore a trashed document or permanently remove it after confirmation.
   * @param id - trash identity.
   * @param version - retained content token.
   * @param purge - true only after explicit permanent deletion confirmation.
   */
  restore(id: string, version: unknown, purge = false): Promise<void> {
    return this.mutate(async () => {
      if (!/^[a-f0-9-]{36}$/u.test(id)) throw new SiminFileError('invalidData')
      const dir = await this.internal('trash')
      const meta = trashRecord(JSON.parse(await regularText(join(dir, `${id}.json`))))
      const source = join(dir, `${id}.txt`)
      if (siminVersion(await regularText(source)) !== version) throw new SiminFileError('conflict', 409)
      if (!purge) {
        const target = join(await this.directory(meta.project), meta.file)
        try { await link(source, target) } catch (error: unknown) { if (exists(error)) throw new SiminFileError('duplicate', 409); throw error }
      }
      await unlink(source)
      await unlink(join(dir, `${id}.json`))
    })
  }
  /**
   * Locate the private proposal storage directory.
   * @param folder - internal owner directory.
   * @returns its private disk path.
   */
  metadata(folder: 'proposals'): Promise<string> { return this.internal(folder) }
}
