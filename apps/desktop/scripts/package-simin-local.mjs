/** Build Simin's personal macOS bundle from the current local production packages. */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeDesktopRuntime, verifyDesktopRuntime } from '../lib/types/runtime-tree.js'
import { DESKTOP_HOST_PROTOCOL_VERSION } from '../lib/types/host-protocol.js'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const desktop = join(root, 'apps/desktop')
const build = join(desktop, '.desktop-build/simin-local')
const deployed = join(build, 'deployed')
const bundle = join(root, 'dist/Simin Lab.app')
const require = createRequire(join(desktop, 'package.json'))
const electron = require('electron')
const pnpmRoot = dirname(require.resolve('pnpm'))
const pnpm = join(pnpmRoot, 'bin/pnpm.mjs')
const manifest = JSON.parse(readFileSync(join(desktop, 'package.json'), 'utf8'))
const home = join(desktop, '.desktop-build/development/home')
const userData = join(desktop, '.desktop-build/development/electron-user-data')

/** Copy package files and reproduce version-specific resolution without external links. */
function materializePackages(inputs, destination, extra = []) {
  const top = new Map()
  for (const input of inputs) {
    if (!existsSync(input)) continue
    for (const entry of readdirSync(input, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || (!entry.isDirectory() && !entry.isSymbolicLink())) continue
      if (entry.name.startsWith('@')) {
        for (const child of readdirSync(join(input, entry.name))) top.set(`${entry.name}/${child}`, realpathSync(join(input, entry.name, child)))
      } else top.set(entry.name, realpathSync(join(input, entry.name)))
    }
  }
  for (const [name, source] of extra) top.set(name, realpathSync(source))
  // Peer-only runtime packages must share one module identity across all consumers.
  const scanned = new Set()
  const pendingSources = [...top.values()]
  while (pendingSources.length > 0) {
    const source = pendingSources.pop()
    if (scanned.has(source)) continue
    scanned.add(source)
    const data = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'))
    const lookup = createRequire(join(source, 'package.json'))
    for (const dependency of Object.keys({ ...data.dependencies, ...data.peerDependencies, ...data.optionalDependencies })) {
      let found
      for (const search of lookup.resolve.paths(dependency) ?? []) {
        const path = join(search, dependency)
        if (existsSync(join(path, 'package.json'))) { found = realpathSync(path); break }
      }
      const hoisted = join(root, 'node_modules/.pnpm/node_modules', dependency)
      if (found === undefined && top.has(dependency)) found = top.get(dependency)
      if (found === undefined && existsSync(join(hoisted, 'package.json'))) found = realpathSync(hoisted)
      if (found === undefined) {
        if (data.optionalDependencies?.[dependency] !== undefined || data.peerDependenciesMeta?.[dependency]?.optional) continue
        throw new Error(`Missing dependency ${dependency} of ${data.name}`)
      }
      if (!top.has(dependency)) top.set(dependency, found)
      pendingSources.push(found)
    }
  }
  const versions = new Map()
  const version = path => { if (!versions.has(path)) versions.set(path, JSON.parse(readFileSync(join(path, 'package.json'), 'utf8')).version); return versions.get(path) }
  const copied = new Map()
  const workspaceModules = join(root, 'node_modules/.pnpm/node_modules')
  const copyPackage = (name, source, target, resolution) => {
    if (copied.has(target)) return
    copied.set(target, source)
    const data = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'))
    const published = source.startsWith(root + '/') && Array.isArray(data.files) ? data.files.filter(value => !value.startsWith('!')).map(value => value.split('/')[0]) : null
    cpSync(source, target, { recursive: true, dereference: true, filter: path => {
      const local = relative(source, path).split('/')
      if (local.includes('node_modules') || local.includes('.git')) return false
      if (published === null || local[0] === '' || ['package.json', 'README.md', 'LICENSE'].includes(local[0])) return true
      return published.some(value => value.includes('*') ? local[0].endsWith(value.slice(value.lastIndexOf('*') + 1)) : value === local[0])
    } })
    const lookup = createRequire(join(source, 'package.json'))
    const available = new Map(resolution)
    available.set(name, source)
    for (const dependency of Object.keys({ ...data.dependencies, ...data.peerDependencies, ...data.optionalDependencies })) {
      let found
      for (const search of lookup.resolve.paths(dependency) ?? []) {
        const path = join(search, dependency)
        if (existsSync(join(path, 'package.json'))) { found = realpathSync(path); break }
      }
      if (found === undefined && top.has(dependency)) found = top.get(dependency)
      if (found === undefined && existsSync(join(workspaceModules, dependency, 'package.json'))) found = realpathSync(join(workspaceModules, dependency))
      if (found === undefined) {
        if (data.optionalDependencies?.[dependency] !== undefined || data.peerDependenciesMeta?.[dependency]?.optional) continue
        throw new Error(`Missing dependency ${dependency} of ${name}`)
      }
      const current = available.get(dependency)
      if (current !== undefined && version(current) === version(found)) continue
      const child = join(target, 'node_modules', dependency)
      copyPackage(dependency, found, child, available)
    }
  }
  mkdirSync(destination, { recursive: true })
  for (const [name, source] of top) copyPackage(name, source, join(destination, name), top)
  return [...top.keys()]
}

if (process.platform !== 'darwin' || process.arch !== 'arm64') throw new Error('Simin personal bundle requires this arm64 Mac')
mkdirSync(build, { recursive: true })
if (!process.argv.includes('--reuse-deploy')) {
  rmSync(deployed, { recursive: true, force: true })
  execFileSync(process.execPath, [pnpm, '--config.verify-deps-before-run=false', '--filter', '@deepseek-ai/dsh-desktop-host', 'deploy', '--prod', '--legacy', deployed], { cwd: root, stdio: 'inherit' })
}
rmSync(bundle, { recursive: true, force: true })
mkdirSync(dirname(bundle), { recursive: true })
execFileSync('/usr/bin/ditto', [resolve(dirname(electron), '../..'), bundle])
const resources = join(bundle, 'Contents/Resources')
rmSync(join(resources, 'default_app.asar'), { force: true })
const app = join(resources, 'app')
mkdirSync(app, { recursive: true })
for (const directory of ['lib', 'renderer']) cpSync(join(desktop, directory), join(app, directory), { recursive: true })
const dsh = join(app, 'dsh')
const shared = materializePackages([
  join(deployed, 'node_modules/.pnpm/node_modules'), join(deployed, 'node_modules'),
], join(dsh, 'node_modules'), [['@deepseek-ai/dsh-desktop-host', deployed]])
writeFileSync(join(dsh, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-desktop-runtime', type: 'module', private: true, version: manifest.version }))
const release = {
  schemaVersion: 1, version: manifest.version, hostProtocolVersion: DESKTOP_HOST_PROTOCOL_VERSION,
  nodeVersion: execFileSync(electron, ['-p', 'process.versions.node'], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8' }).trim(),
  pnpmVersion: JSON.parse(readFileSync(join(pnpmRoot, 'package.json'), 'utf8')).version,
}
writeDesktopRuntime(dsh, release, shared, { platform: 'darwin', arch: 'arm64' })
await verifyDesktopRuntime(dsh, manifest.version, { platform: 'darwin', arch: 'arm64' })
materializePackages([], join(app, 'node_modules'), Object.keys(manifest.dependencies).map(name => [name, join(desktop, 'node_modules', name)]))
cpSync(join(desktop, '.desktop-build/targets/mac-arm64/runtime/primary-runtime'), join(resources, 'runtime/primary-runtime'), { recursive: true })
cpSync(join(desktop, '.desktop-build/targets/mac-arm64/runtime/office-skills'), join(resources, 'runtime/office-skills'), { recursive: true })
cpSync(dirname(dirname(pnpm)), join(resources, 'runtime/pnpm'), { recursive: true })
cpSync(join(desktop, 'scripts/node-bin'), join(resources, 'runtime/bin'), { recursive: true })
mkdirSync(join(resources, 'runtime/cli/bin'), { recursive: true })
cpSync(join(desktop, 'cli/dsh'), join(resources, 'runtime/cli/bin/dsh'))
cpSync(join(desktop, 'lib/command-manager-entry.js'), join(resources, 'runtime/cli/command-manager.js'))
writeFileSync(join(resources, 'runtime/versions.json'), JSON.stringify({ schemaVersion: 1, node: release.nodeVersion, pnpm: release.pnpmVersion }))
writeFileSync(join(app, 'simin-main.mjs'), `import { app } from 'electron'\nprocess.env.DSH_HOME = ${JSON.stringify(home)}\nprocess.env.DSH_DESKTOP_OPEN_DEVTOOLS = '0'\napp.setPath('userData', ${JSON.stringify(userData)})\nawait import('./lib/main.js')\n`)
writeFileSync(join(app, 'package.json'), JSON.stringify({ ...manifest, main: 'simin-main.mjs', name: 'simin-workbench', productName: 'Simin Lab', dshDesktopAppId: 'local.simin.workbench', dependencies: manifest.dependencies }))
renameSync(join(bundle, 'Contents/MacOS/Electron'), join(bundle, 'Contents/MacOS/Simin'))
const plist = join(bundle, 'Contents/Info.plist')
for (const [key, value] of Object.entries({ CFBundleIdentifier: 'local.simin.workbench', CFBundleName: 'Simin Lab', CFBundleDisplayName: 'Simin Lab', CFBundleExecutable: 'Simin', CFBundleShortVersionString: manifest.version, CFBundleVersion: '1', NSDesktopFolderUsageDescription: 'Simin Lab 需要访问桌面上的项目文件夹，以读取和保存你的项目文档。' })) {
  execFileSync('/usr/bin/plutil', ['-replace', key, '-json', JSON.stringify(value), plist])
}
const icon = join(desktop, 'resources/simin.icns')
if (existsSync(icon)) { cpSync(icon, join(resources, 'simin.icns')); execFileSync('/usr/bin/plutil', ['-replace', 'CFBundleIconFile', '-string', 'simin.icns', plist]) }
execFileSync('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', bundle], { stdio: 'inherit' })
execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', bundle], { stdio: 'inherit' })
execFileSync('/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister', ['-f', bundle])
console.log(`Simin personal Mac application: ${bundle}`)
