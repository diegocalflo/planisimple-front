#!/usr/bin/env node
// SessionStart: lo que imprime entra como contexto. Rama, últimos commits,
// cambios sin commit y, si la sesión viene de compactar, el estado guardado.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const MAX_STATUS_LINES = 30

function readEvent() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}')
  } catch {
    return {}
  }
}

// Sin trim: el espacio inicial de `git status --short` es parte del código de estado.
function git(...args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trimEnd()
  } catch {
    return ''
  }
}

try {
  const event = readEvent()
  const lines = []
  const branch = git('branch', '--show-current')
  if (branch) lines.push(`Rama: ${branch}`)
  const log = git('log', '--oneline', '-5')
  if (log) lines.push('Últimos commits:', log)
  const status = git('status', '--short').split('\n').filter(Boolean)
  if (status.length === 0) {
    lines.push('Sin cambios pendientes.')
  } else {
    const shown = status.slice(0, MAX_STATUS_LINES)
    const rest = status.length - shown.length
    lines.push('Cambios sin commit:', ...shown, ...(rest > 0 ? [`… y ${rest} más`] : []))
  }
  const statePath = join(root, '.claude', '.session-state.md')
  if (event.source === 'compact' && existsSync(statePath)) {
    lines.push('', readFileSync(statePath, 'utf8').trim())
  }
  console.log(lines.join('\n'))
} catch {
  // Fallar suave: un hook de inicio roto no debe frenar la sesión.
}
process.exit(0)
