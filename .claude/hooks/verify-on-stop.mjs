#!/usr/bin/env node
// Stop: si cambió código desde la última verificación, corre lint, typecheck y
// las pruebas relacionadas con lo cambiado. Si algo falla sale con 2 y Claude
// corrige antes de dar la tarea por terminada.
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const bin = (name) => join(root, 'node_modules', '.bin', name)
const fingerprintPath = join(root, '.claude', '.stop-check')
const RELEVANT = /^(src\/|index\.html$|package(-lock)?\.json$|tsconfig.*\.json$|vite\.config\.ts$|\.oxlintrc\.json$)/
const MAX_OUTPUT_LINES = 60

function readEvent() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}')
  } catch {
    return {}
  }
}

function changedFiles() {
  const out = execFileSync('git', ['status', '--porcelain', '-uall'], { cwd: root, encoding: 'utf8' })
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).split(' -> ').pop())
    .filter((path) => RELEVANT.test(path))
}

function fingerprint(files) {
  const hash = createHash('sha1')
  for (const file of files.sort()) {
    const full = join(root, file)
    const stat = existsSync(full) ? statSync(full) : null
    hash.update(`${file}:${stat ? `${stat.size}:${stat.mtimeMs}` : 'borrado'}\n`)
  }
  return hash.digest('hex')
}

function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' })
  if (result.error) return null
  if (result.status === 0) return null
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split('\n')
  const shown = output.slice(-MAX_OUTPUT_LINES).join('\n')
  return `✗ ${label}\n${shown}`
}

try {
  const event = readEvent()
  if (!existsSync(bin('oxlint')) || !existsSync(bin('tsc')) || !existsSync(bin('vitest'))) process.exit(0)

  const files = changedFiles()
  if (files.length === 0) process.exit(0)
  const current = fingerprint(files)
  if (existsSync(fingerprintPath) && readFileSync(fingerprintPath, 'utf8') === current) process.exit(0)

  const failure =
    run('npm run lint', bin('oxlint'), ['-f', 'unix']) ??
    run('npm run typecheck', bin('tsc'), ['-b']) ??
    run('pruebas de lo cambiado', bin('vitest'), ['run', '--changed', '--passWithNoTests'])

  if (!failure) {
    writeFileSync(fingerprintPath, current)
    process.exit(0)
  }
  if (event.stop_hook_active) {
    // Claude ya está corrigiendo por este hook: se informa sin volver a bloquear.
    process.stderr.write(`La verificación sigue fallando:\n${failure}\n`)
    process.exit(1)
  }
  process.stderr.write(`La verificación falló; corrige antes de terminar.\n${failure}\n`)
  process.exit(2)
} catch {
  // Fallar suave: sin git o sin dependencias no se bloquea a nadie.
  process.exit(0)
}
