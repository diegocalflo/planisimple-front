#!/usr/bin/env node
// PreCompact: guarda rama, último commit y archivos tocados en
// .claude/.session-state.md. session-start.mjs lo vuelve a cargar tras compactar.
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()

function git(...args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

try {
  const status = git('status', '--short')
  const content = [
    '# Estado antes de compactar',
    '',
    `- Guardado: ${new Date().toISOString()}`,
    `- Rama: ${git('branch', '--show-current') || 'desconocida'}`,
    `- Último commit: ${git('log', '--oneline', '-1') || 'ninguno'}`,
    '',
    '## Archivos con cambios',
    '',
    status ? status.split('\n').map((line) => `- \`${line.trim()}\``).join('\n') : 'Ninguno.',
    '',
  ].join('\n')
  writeFileSync(join(root, '.claude', '.session-state.md'), content)
} catch {
  // Fallar suave.
}
process.exit(0)
