/** Validated HTTP data for the local workbench; documents remain on disk. */
/** One text file's metadata and preview. */
export interface SiminFile { name: string; modifiedAt: number; bytes: number; preview: string }
/** A project directory and its real documents. */
export interface SiminProject { name: string; path: string; documents: string[]; files: SiminFile[] }
/** A recoverable file in the workbench trash. */
export interface SiminTrash { id: string; project: string; file: string; deletedAt: number; version: string; markdown: string }
/** A retained save proposal from the existing Agent. */
export interface SiminProposal {
  id: string
  project: string
  file: string
  sessionId: string
  createdAt: number
  before: string | null
  after: string
  version: string | null
  status: string
}
/** Host-authoritative workbench snapshot. */
export interface SiminSnapshot { root: string; projects: SiminProject[]; trash: SiminTrash[]; proposals: SiminProposal[] }
/** A document's current content and mutation token. */
export interface SiminDocument { markdown: string; version: string }
/** One search result from the existing session search API. */
export interface SiminConversationHit { sessionId: string; title: string; snippet: string; project: string; path: string }
function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('invalidData')
  return value as Record<string, unknown>
}
function text(value: unknown): string { if (typeof value !== 'string') throw new Error('invalidData'); return value }
function number(value: unknown): number { if (typeof value !== 'number') throw new Error('invalidData'); return value }
function array(value: unknown): unknown[] { if (!Array.isArray(value)) throw new Error('invalidData'); return value }
/**
 * Request decoded workbench data from the local Host.
 * @param path - local endpoint.
 * @param payload - optional POST JSON.
 * @param signal - request cancellation.
 * @returns decoded JSON; failures retain the Host's error code.
 */
export async function siminRequest(path: string, payload?: Record<string, unknown>, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(path, { ...(signal === undefined ? {} : { signal }), ...(payload === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }) })
  const data: unknown = await response.json()
  if (!response.ok) throw new Error(text(record(data).error))
  return data
}
/**
 * Read and validate the current workbench data.
 * @param signal - refresh lifetime.
 * @returns parsed real project, trash and proposal data.
 */
export async function siminSnapshot(signal?: AbortSignal): Promise<SiminSnapshot> {
  const data = record(await siminRequest('/aipm/state', undefined, signal))
  const projects = array(data.projects).map((value) => {
    const item = record(value)
    const files = array(item.files).map((raw) => {
      const file = record(raw)
      return { name: text(file.name), modifiedAt: number(file.modifiedAt), bytes: number(file.bytes), preview: text(file.preview) }
    })
    return { name: text(item.name), path: text(item.path), documents: array(item.documents).map(text), files }
  })
  const trash = array(data.trash).map((value) => {
    const item = record(value)
    return { id: text(item.id), project: text(item.project), file: text(item.file),
      deletedAt: number(item.deletedAt), version: text(item.version), markdown: text(item.markdown) }
  })
  const proposals = array(data.proposals).map((value) => {
    const item = record(value)
    return { id: text(item.id), project: text(item.project), file: text(item.file),
      sessionId: text(item.sessionId), createdAt: number(item.createdAt), before: item.before === null ? null : text(item.before),
      after: text(item.after), version: item.version === null ? null : text(item.version), status: text(item.status) }
  })
  return { root: text(data.root), projects, trash, proposals }
}
/**
 * Read and validate a document and its content token.
 * @param project - real directory name.
 * @param file - filename.
 * @param signal - request lifetime.
 * @returns current document and content token.
 */
export async function siminDocument(project: string, file: string, signal?: AbortSignal): Promise<SiminDocument> {
  const data = record(await siminRequest(`/aipm/file?project=${encodeURIComponent(project)}&file=${encodeURIComponent(file)}`, undefined, signal))
  return { markdown: text(data.markdown), version: text(data.version) }
}
