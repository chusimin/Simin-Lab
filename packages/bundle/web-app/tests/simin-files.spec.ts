/** Actual-disk behavior for project documents and recoverable trash. */
import { mkdtemp, readdir, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SiminFiles, siminVersion } from '../src/simin-files.ts'
import { SiminProposals } from '../src/simin-proposals.ts'

let root: string
let files: SiminFiles
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'simin-files-')); files = new SiminFiles(root) })
afterEach(async () => { await rm(root, { recursive: true, force: true }) })

describe('Simin project files', () => {
  it('creates an actually empty project and refuses a duplicate', async () => {
    const project = await files.create('需求梳理')
    expect(await readdir(project.path)).toEqual([])
    expect(project.documents).toEqual([])
    await expect(files.create('需求梳理')).rejects.toMatchObject({ code: 'duplicate', status: 409 })
  })
  it('reads real files and omits unrelated files and symbolic links', async () => {
    const project = await files.create('产品')
    await writeFile(join(project.path, '信息.md'), '# 已有证据\n真实正文')
    await writeFile(join(project.path, 'image.png'), 'not a document')
    await symlink(join(project.path, '信息.md'), join(project.path, '链接.md'))
    expect((await files.projects())[0]?.documents).toEqual(['信息.md'])
    expect((await files.projects())[0]?.files[0]?.preview).toContain('真实正文')
    await expect(files.read('产品', '链接.md')).rejects.toThrow()
  })
  it('rejects path traversal and linked project directories', async () => {
    await expect(files.create('../escape')).rejects.toMatchObject({ code: 'invalidName' })
    await files.create('产品')
    await expect(files.read('产品', '../escape.md')).rejects.toMatchObject({ code: 'invalidName' })
    await symlink(join(root, '产品'), join(root, '链接'))
    await expect(files.read('链接', 'x.md')).rejects.toMatchObject({ code: 'invalidProject' })
  })
  it('creates on confirmation and refuses stale edits without changing the file', async () => {
    await files.create('产品')
    const saved = await files.save('产品', '信息.md', '# 一', null)
    await writeFile(join(root, '产品', '信息.md'), '# 外部编辑')
    await expect(files.save('产品', '信息.md', '# 二', saved.version)).rejects.toMatchObject({ code: 'conflict', status: 409 })
    expect((await files.read('产品', '信息.md')).markdown).toBe('# 外部编辑')
    await expect(files.save('产品', '信息.md', 'overwrite', null)).rejects.toMatchObject({ code: 'conflict' })
  })
  it('serializes two creation requests so one wins and neither silently overwrites', async () => {
    await files.create('产品')
    const results = await Promise.allSettled([files.save('产品', 'a.md', 'one', null), files.save('产品', 'a.md', 'two', null)])
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect((await files.read('产品', 'a.md')).markdown).toBe('one')
  })
  it('renames a file and refuses an existing destination', async () => {
    await files.create('产品')
    const saved = await files.save('产品', 'a.md', 'one', null)
    await files.save('产品', 'b.md', 'two', null)
    await expect(files.rename('产品', 'a.md', 'b.md', saved.version)).rejects.toMatchObject({ code: 'duplicate' })
    await files.rename('产品', 'a.md', '新的信息.md', saved.version)
    expect(await files.optional('产品', 'a.md')).toBeNull()
    expect((await files.read('产品', '新的信息.md')).markdown).toBe('one')
  })
  it('retains deleted content across restart and restores it to the original project', async () => {
    await files.create('产品')
    const saved = await files.save('产品', 'a.md', 'keep me', null)
    const id = await files.trash('产品', 'a.md', saved.version)
    expect(await files.optional('产品', 'a.md')).toBeNull()
    const restarted = new SiminFiles(root)
    const item = (await restarted.trashList())[0]
    expect(item).toMatchObject({ id, project: '产品', file: 'a.md', markdown: 'keep me' })
    await restarted.restore(id, saved.version)
    expect((await restarted.read('产品', 'a.md')).markdown).toBe('keep me')
    expect(await restarted.trashList()).toEqual([])
  })
  it('keeps both files when restoration conflicts and purges only the confirmed trash item', async () => {
    await files.create('产品')
    const saved = await files.save('产品', 'a.md', 'old', null)
    const id = await files.trash('产品', 'a.md', saved.version)
    await files.save('产品', 'a.md', 'new', null)
    await expect(files.restore(id, saved.version)).rejects.toMatchObject({ code: 'duplicate' })
    expect((await files.trashList())[0]?.markdown).toBe('old')
    expect((await files.read('产品', 'a.md')).markdown).toBe('new')
    await files.restore(id, saved.version, true)
    expect(await files.trashList()).toEqual([])
    expect((await files.read('产品', 'a.md')).markdown).toBe('new')
  })
})

describe('retained write previews', () => {
  async function pending(before: string | null = null) {
    await files.create('产品')
    if (before !== null) await files.save('产品', 'a.md', before, null)
    const id = '12345678-1234-1234-1234-123456789abc'
    const item = { id, project: '产品', file: 'a.md', sessionId: 'fixture', before, after: 'proposed', version: before === null ? null : siminVersion(before), status: 'pending', createdAt: 1 }
    await writeFile(join(await files.metadata('proposals'), `${id}.json`), JSON.stringify(item))
    return id
  }
  it('marks abandoned tools interrupted and saves nothing until explicitly confirmed', async () => {
    const id = await pending()
    const proposals = new SiminProposals(files)
    expect((await proposals.list())[0]?.status).toBe('interrupted')
    expect(await files.optional('产品', 'a.md')).toBeNull()
    await proposals.decide(id, true)
    expect((await files.read('产品', 'a.md')).markdown).toBe('proposed')
    expect((await proposals.list())[0]?.status).toBe('saved')
    await expect(proposals.decide(id, true)).rejects.toMatchObject({ code: 'conflict' })
  })
  it('cancels without modifying the original content', async () => {
    const id = await pending('original')
    const proposals = new SiminProposals(files)
    await proposals.decide(id, false)
    expect((await files.read('产品', 'a.md')).markdown).toBe('original')
    expect((await proposals.list())[0]?.status).toBe('rejected')
  })
  it('accepts only one decision when confirmation and cancellation overlap', async () => {
    const id = await pending()
    const proposals = new SiminProposals(files)
    const results = await Promise.allSettled([proposals.decide(id, true), proposals.decide(id, false)])
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect((await proposals.list())[0]?.status).toBe('saved')
    expect((await files.read('产品', 'a.md')).markdown).toBe('proposed')
  })
  it('refuses confirmation after an external edit and retains the preview', async () => {
    const id = await pending('original')
    await writeFile(join(root, '产品', 'a.md'), 'external')
    const proposals = new SiminProposals(files)
    await expect(proposals.decide(id, true)).rejects.toMatchObject({ code: 'conflict' })
    expect((await files.read('产品', 'a.md')).markdown).toBe('external')
    expect((await proposals.list())[0]?.after).toBe('proposed')
  })
})
