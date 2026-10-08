import { defineConfig } from 'tsdown'

/**
 * Host bundle for the web surface. Entry points are the tsc emit, so the
 * AIPM product route in src/ is included after `tsc -b`.
 */
export default defineConfig({
  entry: ['lib/types/index.js', 'lib/types/startup.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
})
