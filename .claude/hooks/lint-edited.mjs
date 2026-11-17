#!/usr/bin/env node
// PostToolUse (Edit|Write): corre oxlint sobre el archivo recién editado.
// Si hay errores sale con 2 y Claude los recibe para corregir. Es liviano:
// un archivo, sin typecheck ni pruebas (eso va en verify-on-stop.mjs).
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const oxlint = join(root, 'node_modules', '.bin', 'oxlint')

let filePath
try {
  filePath = JSON.parse(readFileSync(0, 'utf8') || '{}').tool_input?.file_path
} catch {
  process.exit(0)
}

if (!filePath || !/\.(ts|tsx)$/.test(filePath) || !existsSync(oxlint)) process.exit(0)
const rel = relative(root, filePath)
if (rel.startsWith('..') || !rel.startsWith('src/')) process.exit(0)

const result = spawnSync(oxlint, ['-f', 'unix', rel], { cwd: root, encoding: 'utf8' })
if (result.error) process.exit(0)
if (result.status !== 0) {
  process.stderr.write(`oxlint encontró errores en ${rel}:\n${result.stdout}${result.stderr}`)
  process.exit(2)
}
process.exit(0)
