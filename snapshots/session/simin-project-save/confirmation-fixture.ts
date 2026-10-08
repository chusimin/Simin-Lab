/** Deterministic user confirmation for a recorded Simin tool proposal. */
import type { Context } from '@deepseek-ai/cordis'
import { basename, dirname } from 'node:path'
import { SiminFiles } from '../../../packages/bundle/web-app/src/simin-files.ts'
import { SiminProposals, installSiminProposals } from '../../../packages/bundle/web-app/src/simin-proposals.ts'

/**
 * Install deterministic user confirmation for this snapshot fixture.
 * @param ctx - shipped profile context; the fixture alone supplies the user's affirmative decision.
 */
export function apply(ctx: Context): void {
  const cwd = process.cwd()
  const proposals = new SiminProposals(new SiminFiles(dirname(cwd)))
  installSiminProposals(ctx, proposals)
  ctx.effect(() => {
    let running = false
    const timer = setInterval(() => {
      if (running) return
      running = true
      void proposals.list().then(async items => {
        const pending = items.find(item => item.project === basename(cwd) && item.status === 'pending')
        if (pending !== undefined) await proposals.decide(pending.id, true)
      }).catch((error: unknown) => { console.warn('Simin fixture confirmation:', error) }).finally(() => { running = false })
    }, 100)
    return () => { clearInterval(timer) }
  }, 'Simin fixture: deterministic confirmation')
}
