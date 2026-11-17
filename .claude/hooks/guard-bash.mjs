#!/usr/bin/env node
// PreToolUse (Bash): bloquea lo que las reglas deny de settings.json no alcanzan,
// porque esas comparan el texto del comando. Este hook lo lee como la shell
// (comillas, escapes, $(…), subshells, heredocs, sh -c, eval, xargs, find -exec)
// y bloquea:
// - nombrar un .env con secretos, también entre comillas o con un patrón (.env*),
//   y las búsquedas recursivas que pasan por la raíz cuando existe uno;
// - borrados masivos: rm recursivo con cualquier ruta o envoltorio, find -delete,
//   git clean -f y rimraf;
// - el push forzado y saltarse los hooks de Git (--no-verify, commit -n, core.hooksPath).
// No expande variables ni lee scripts: es una baranda contra errores, no un
// sandbox. Si bloquea sale con 2 y Claude recibe el motivo. Si el hook mismo
// falla sale con 1, el comando sigue y quedan las reglas deny como respaldo.
import { readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, resolve } from 'node:path'

const root = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd())
const MAX_DEPTH = 4

// Los mismos archivos que niegan las reglas Read(…) de settings.json.
const SECRET_ENV = /^\.env(\.local|\.production|\.[^./]+\.local)?$/
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh'])
const KEYWORDS = new Set(['!', '{', '}', 'if', 'then', 'elif', 'else', 'while', 'until', 'do'])
// Envoltorios que ejecutan el comando que les sigue, con sus opciones cortas
// que toman el valor en la palabra siguiente.
const WRAPPERS = {
  sudo: 'ugCDhprtU',
  env: 'uSC',
  command: '',
  builtin: '',
  exec: 'a',
  nice: 'n',
  nohup: '',
  time: '',
  timeout: 'sk',
  xargs: 'adEIJLnPRSs',
}
// Opciones de grep y rg que toman valor: cortas, y largas cuando van sin `=`.
const GREP = {
  short: 'efmABCdD',
  long: ['--regexp', '--file', '--max-count', '--after-context', '--before-context', '--context', '--include', '--exclude', '--exclude-dir', '--exclude-from', '--label', '--binary-files', '--devices', '--directories'],
}
const SEARCHES = {
  grep: GREP,
  egrep: GREP,
  fgrep: GREP,
  rg: {
    short: 'efgtTABCmjMEdr',
    long: ['--regexp', '--file', '--glob', '--iglob', '--type', '--type-not', '--type-add', '--after-context', '--before-context', '--context', '--max-count', '--max-depth', '--max-columns', '--threads', '--replace', '--encoding', '--sort', '--sortr', '--pre', '--color', '--colors'],
  },
}

function listSecretFiles() {
  try {
    return readdirSync(root).filter((name) => SECRET_ENV.test(name))
  } catch {
    return []
  }
}

const secretFiles = listSecretFiles()
// Contra estos se prueban los patrones: los que existen y los típicos aunque aún no existan.
const secretNames = [...new Set([...secretFiles, '.env', '.env.local', '.env.production', '.env.development.local'])]

// Divide un script en comandos: listas de palabras ya sin comillas ni escapes.
// Los operadores (; & | && ||), los paréntesis y los saltos de línea separan
// comandos, así que lo que va en $(…) o en una subshell queda como un comando
// más; dentro de comillas dobles, $(…) y `…` se leen aparte. El cuerpo de un
// heredoc solo se analiza si en esa línea hay una shell que lo ejecute.
function parse(src, start = 0, untilParen = false) {
  const commands = []
  const heredocs = []
  let words = []
  let word = ''
  let inWord = false
  let quote = ''
  let depth = 0
  let lineRunsShell = false
  let i = start

  const endWord = () => {
    if (inWord) words.push(word)
    word = ''
    inWord = false
  }
  const endCommand = () => {
    endWord()
    if (words.length === 0) return
    if (SHELLS.has(basename(unwrap(words)[0] ?? ''))) lineRunsShell = true
    commands.push(words)
    words = []
  }
  // Con i en `<<`: anota el delimitador; el cuerpo empieza en la línea siguiente.
  const readHeredocStart = () => {
    i += 2
    const strip = src[i] === '-'
    if (strip) i++
    while (src[i] === ' ' || src[i] === '\t') i++
    let delimiter = ''
    for (; i < src.length && !' \t\n;&|()<>'.includes(src[i]); i++) {
      if (!`'"\\`.includes(src[i])) delimiter += src[i]
    }
    heredocs.push({ delimiter, strip })
    i--
  }
  // Con i en el salto de línea: salta los cuerpos pendientes y analiza los que van a una shell.
  const readHeredocBodies = () => {
    let pos = i + 1
    for (const { delimiter, strip } of heredocs) {
      const lines = []
      while (pos < src.length) {
        const newline = src.indexOf('\n', pos)
        const end = newline === -1 ? src.length : newline
        const line = src.slice(pos, end)
        pos = end + 1
        if ((strip ? line.replace(/^\t+/, '') : line) === delimiter) break
        lines.push(line)
      }
      if (lineRunsShell) commands.push(...parse(lines.join('\n')).commands)
    }
    heredocs.length = 0
    i = pos - 1
  }

  for (; i < src.length; i++) {
    const c = src[i]
    if (quote === "'") {
      if (c === "'") quote = ''
      else word += c
    } else if (quote === '"') {
      if (c === '"') quote = ''
      else if (c === '\\' && '$`"\\\n'.includes(src[i + 1] ?? 'x')) {
        i++
        if (src[i] !== '\n') word += src[i]
      } else if (c === '$' && src[i + 1] === '(') {
        const inner = parse(src, i + 2, true)
        commands.push(...inner.commands)
        word += '$(…)'
        i = inner.end
      } else if (c === '`') {
        const close = src.indexOf('`', i + 1)
        const end = close === -1 ? src.length : close
        commands.push(...parse(src.slice(i + 1, end)).commands)
        word += '`…`'
        i = end
      } else word += c
    } else if (c === "'" || c === '"') {
      quote = c
      inWord = true
    } else if (c === '\\') {
      i++
      if (i < src.length && src[i] !== '\n') {
        word += src[i]
        inWord = true
      }
    } else if (c === '#' && !inWord) {
      while (i + 1 < src.length && src[i + 1] !== '\n') i++
    } else if (src.startsWith('<<<', i)) {
      endWord()
      i += 2
    } else if (src.startsWith('<<', i)) {
      endWord()
      readHeredocStart()
    } else if (c === ' ' || c === '\t' || c === '<' || c === '>') {
      endWord()
    } else if (c === '\n') {
      endCommand()
      if (heredocs.length > 0) readHeredocBodies()
      lineRunsShell = false
    } else if (c === '(') {
      depth++
      endCommand()
    } else if (c === ')') {
      endCommand()
      if (untilParen && depth === 0) return { commands, end: i }
      depth--
    } else if (';&|`'.includes(c)) {
      endCommand()
    } else {
      word += c
      inWord = true
    }
  }
  endCommand()
  return { commands, end: i }
}

// Quita lo que precede al comando real: palabras clave (if, do, !…), asignaciones
// (FOO=1) y envoltorios como sudo, env, timeout o xargs con sus opciones.
function unwrap(words) {
  let i = 0
  for (;;) {
    while (i < words.length && (KEYWORDS.has(words[i]) || /^[A-Za-z_]\w*=/.test(words[i]))) i++
    const name = basename(words[i] ?? '')
    if (!Object.hasOwn(WRAPPERS, name)) return words.slice(i)
    i++
    while (i < words.length && /^-./.test(words[i])) {
      const option = words[i++]
      if (option === '--') break
      if (option.length === 2 && WRAPPERS[name].includes(option[1])) i++
    }
    if (name === 'timeout') i++
  }
}

// ¿Aparece la opción corta `flag`, sola o en un grupo como -nm? Las letras de
// `valued` toman valor (pegado o en la palabra siguiente, que no se mira); las de
// `attached` solo pegado. Después de `--` ya no hay opciones.
function hasShortFlag(args, flag, valued = '', attached = '') {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--') return false
    if (!/^-[^-]/.test(arg)) continue
    for (let j = 1; j < arg.length; j++) {
      if (arg[j] === flag) return true
      if (attached.includes(arg[j])) break
      if (valued.includes(arg[j])) {
        if (j === arg.length - 1) i++
        break
      }
    }
  }
  return false
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Convierte un patrón de la shell (*, ?, [..], {a,b}) en una expresión regular.
function globToRegExp(glob) {
  let source = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    const close = c === '[' ? glob.indexOf(']', i + 2) : c === '{' ? glob.indexOf('}', i) : -1
    if (c === '*') source += '[^/]*'
    else if (c === '?') source += '[^/]'
    else if (c === '[' && close !== -1) {
      source += `[${glob.slice(i + 1, close).replace(/^!/, '^')}]`
      i = close
    } else if (c === '{' && close !== -1 && glob.slice(i, close).includes(',')) {
      source += `(?:${glob.slice(i + 1, close).split(',').map(escapeRegExp).join('|')})`
      i = close
    } else source += escapeRegExp(c)
  }
  try {
    return new RegExp(`^${source}$`)
  } catch {
    return null
  }
}

// El .env con secretos que nombra la palabra, directo o con un patrón (.env*,
// .e?v.local, .env{,.local}). Mira cada trozo entre = y :, para atrapar
// --env-file=.env.local. Un texto con espacios, como un mensaje, no cuenta.
function secretMention(word) {
  for (const part of word.split(/[=:]/)) {
    const name = part.slice(part.lastIndexOf('/') + 1)
    // Un patrón que no empieza con punto no alcanza archivos ocultos.
    if (!name.startsWith('.') && !name.startsWith('{')) continue
    const pattern = globToRegExp(name)
    const file = pattern && secretNames.find((candidate) => pattern.test(candidate))
    if (file) return file
  }
  return null
}

// Ruta absoluta de `path` vista desde `cwd`, o null si depende de una variable desconocida.
function absolutePath(path, cwd) {
  const known = { PWD: cwd, HOME: homedir(), CLAUDE_PROJECT_DIR: root }
  const expanded = path
    .replace(/^~(?=\/|$)/, homedir())
    .replace(/\$\{?(PWD|HOME|CLAUDE_PROJECT_DIR)\}?/g, (_, name) => known[name])
  return expanded.includes('$') ? null : resolve(cwd, expanded)
}

const comparable = (path) => (process.platform === 'darwin' ? path.toLowerCase() : path)

// ¿Buscar en `path` recorre la raíz del proyecto? Con una variable desconocida, se asume que sí.
function reachesRoot(path, cwd) {
  const absolute = absolutePath(path, cwd)
  if (absolute === null) return true
  const dir = comparable(absolute)
  const target = comparable(root)
  return target === dir || target.startsWith(dir.endsWith('/') ? dir : `${dir}/`)
}

// Separa el patrón y las rutas de grep o rg, y dice si la búsqueda lo recorre todo:
// grep con -r, o rg mirando ocultos e ignorados (-uu, o --hidden con --no-ignore).
function parseSearch(name, args) {
  const spec = SEARCHES[name]
  const flags = []
  const positionals = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--') {
      positionals.push(...args.slice(i + 1))
      break
    }
    if (arg.startsWith('--')) {
      const option = arg.split('=')[0]
      flags.push(option)
      if (!arg.includes('=') && spec.long.includes(option)) i++
    } else if (/^-./.test(arg)) {
      for (let j = 1; j < arg.length; j++) {
        flags.push(`-${arg[j]}`)
        if (spec.short.includes(arg[j])) {
          if (j === arg.length - 1) i++
          break
        }
      }
    } else positionals.push(arg)
  }
  const explicitPattern = flags.some((flag) => ['-e', '-f', '--regexp', '--file'].includes(flag))
  const pattern = explicitPattern ? undefined : positionals.shift()
  const unrestricted = flags.filter((flag) => flag === '-u' || flag === '--unrestricted').length
  const scansAll =
    name === 'rg'
      ? (unrestricted >= 2 || flags.includes('--hidden') || flags.includes('-.')) &&
        (unrestricted >= 1 || flags.includes('--no-ignore') || flags.includes('--no-ignore-vcs'))
      : flags.some((flag) => ['-r', '-R', '--recursive', '--dereference-recursive'].includes(flag))
  return { pattern, paths: positionals.length > 0 ? positionals : ['.'], scansAll }
}

// El script de `sh -c '…'` (también -lc, -ec…), o null si la shell no recibe uno.
function shellScript(args) {
  let inline = false
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (/^[-+][oO]$/.test(arg)) i++
    else if (/^-[^-]/.test(arg)) inline ||= arg.includes('c')
    else if (!arg.startsWith('--') && !arg.startsWith('+')) return inline ? arg : null
  }
  return null
}

function gitReason(args) {
  let i = 0
  while (i < args.length && args[i].startsWith('-')) {
    const option = args[i++]
    if (option === '-c' && /^core\.hookspath=/i.test(args[i] ?? '')) {
      return 'cambiar core.hooksPath se salta los hooks de Git, y eso está bloqueado en este repo.'
    }
    if (['-c', '-C', '--git-dir', '--work-tree', '--namespace', '--config-env'].includes(option)) i++
  }
  const subcommand = args[i]
  const rest = args.slice(i + 1)
  if (rest.includes('--no-verify') || (subcommand === 'commit' && hasShortFlag(rest, 'n', 'mFCct', 'Su'))) {
    return 'saltarse los hooks de Git (--no-verify o commit -n) está bloqueado en este repo.'
  }
  const forcesPush = rest.some((arg) => /^--(force|force-with-lease|force-if-includes|mirror)(=|$)/.test(arg) || /^\+./.test(arg))
  if (subcommand === 'push' && (forcesPush || hasShortFlag(rest, 'f', 'o'))) {
    return 'el push forzado (--force, -f, --mirror o un refspec con +) está bloqueado. Si hace falta, que lo haga la persona.'
  }
  const forcesClean = rest.includes('--force') || hasShortFlag(rest, 'f', 'e')
  const dryRun = rest.includes('--dry-run') || hasShortFlag(rest, 'n', 'e')
  if (subcommand === 'clean' && forcesClean && !dryRun) {
    return 'git clean -f borra archivos sin seguimiento (con -x, también .env.local y node_modules). Muestra qué borraría con git clean -n y deja que la persona decida.'
  }
  return null
}

function checkCommand(words, state, depth) {
  if (depth > MAX_DEPTH) return null
  const argv = unwrap(words)
  const name = basename(argv[0] ?? '')
  const args = argv.slice(1)
  const search = Object.hasOwn(SEARCHES, name) ? parseSearch(name, args) : null

  // El patrón de grep o rg es el texto que se busca, no una ruta.
  let pattern = search?.pattern
  for (const word of words) {
    if (word === pattern) {
      pattern = undefined
      continue
    }
    const file = secretMention(word)
    if (file) {
      const what = word === file ? `nombra ${file}` : `\`${word}\` alcanza ${file}`
      return `el comando ${what}, que guarda secretos. Si necesitas un valor de ahí, pídeselo a la persona; la plantilla es .env.example.`
    }
  }

  if (name === 'cd' || name === 'pushd') {
    const target = args.find((arg) => arg === '-' || !arg.startsWith('-'))
    if (target === undefined) state.cwd = homedir()
    else state.cwd = target === '-' ? root : (absolutePath(target, state.cwd) ?? root)
    return null
  }
  if (search?.scansAll && secretFiles.length > 0) {
    const path = search.paths.find((candidate) => reachesRoot(candidate, state.cwd))
    if (path !== undefined) {
      return `${name} sobre ${path} recorre la raíz del proyecto y leería ${secretFiles.join(', ')}. Busca dentro de src/ u otra carpeta, o usa la herramienta Grep.`
    }
  }
  if (name === 'rm' && (hasShortFlag(args, 'r') || hasShortFlag(args, 'R') || args.includes('--recursive'))) {
    return 'rm recursivo (-r, -R o --recursive) borra carpetas enteras. Si hace falta, pídeselo a la persona.'
  }
  if (name === 'find') {
    if (args.includes('-delete')) return 'find -delete borra en masa. Lista con find y deja que la persona borre.'
    for (let i = 0; i < args.length; i++) {
      if (!['-exec', '-execdir', '-ok', '-okdir'].includes(args[i])) continue
      let end = i + 1
      while (end < args.length && args[end] !== ';' && args[end] !== '+') end++
      const reason = checkCommand(args.slice(i + 1, end), state, depth + 1)
      if (reason) return reason
      i = end
    }
  }
  if (name === 'git') return gitReason(args)
  if (SHELLS.has(name)) {
    const script = shellScript(args)
    return script === null ? null : check(script, { cwd: state.cwd }, depth + 1)
  }
  if (name === 'eval') return check(args.join(' '), state, depth + 1)
  const runsPackage = ['npx', 'pnpx', 'bunx'].includes(name) || (['npm', 'pnpm', 'yarn'].includes(name) && ['exec', 'x', 'dlx'].includes(args[0]))
  if (name === 'rimraf' || (runsPackage && args.some((arg) => /^rimraf(@|$)/.test(arg)))) {
    return 'rimraf borra carpetas enteras. Si hace falta, pídeselo a la persona.'
  }
  return null
}

function check(script, state, depth) {
  for (const words of parse(script).commands) {
    const reason = checkCommand(words, state, depth)
    if (reason) return reason
  }
  return null
}

try {
  const event = JSON.parse(readFileSync(0, 'utf8') || '{}')
  const command = event.tool_input?.command
  const reason = typeof command === 'string' ? check(command, { cwd: event.cwd ?? root }, 0) : null
  if (reason) {
    process.stderr.write(`Bloqueado por guard-bash: ${reason}\n`)
    process.exit(2)
  }
} catch (error) {
  process.stderr.write(`guard-bash no pudo revisar el comando: ${error.message}\n`)
  process.exit(1)
}
process.exit(0)
