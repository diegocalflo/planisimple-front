# CLAUDE.md

## Proyecto

Frontend de PlaniSimple, la app web donde las docentes generan planificaciones y otros
documentos con IA. El backend vive en otro repo (`planisimple-back`): este solo le habla
por su API HTTP y de Firebase usa únicamente Auth.

## Stack

- React y TypeScript con Vite; React Router con una ruta diferida por actividad.
- Estado del servidor con TanStack Query, sin estado global propio.
- Cliente `openapi-fetch` con tipos generados del OpenAPI del backend ([ADR 0001](docs/decisiones/0001-contrato-openapi.md)).
- Generaciones por polling, sin Firestore en el navegador ([ADR 0002](docs/decisiones/0002-polling-sin-firestore.md)).
- Documentos guardados en el navegador con Dexie (IndexedDB); Word con `docx`.
- Vitest y Testing Library; oxlint, que además impone las dependencias entre carpetas.

## Comandos

- `npm ci`: instala lo fijado en el lockfile.
- `npm run dev`: `http://localhost:5173`, el origen que acepta el CORS del backend. La configuración va en `.env.local` (ver `.env.example`).
- `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.
- `npm run contracts`: regenera `src/contracts/openapi.d.ts`; ver la skill `actualizar-contrato`.

**Terminado** es lint, typecheck, pruebas y build en verde. El hook `Stop` corre los tres
primeros sobre lo cambiado; la CI corre los cuatro en cada push a `main` y en cada PR.

## Estructura

`src/` se organiza por dominio. Entre paréntesis, lo que cada carpeta puede importar;
oxlint rechaza el resto y también los imports con `../`.

- `app/`: arranque, rutas, proveedores, layouts y guardas (todo; cada actividad, solo vía `activities/registry`).
- `activities/`: `registry.ts`, `_shared/` y una carpeta por actividad (documents, api, ui, lib, contracts).
- `documents/`: modelo del documento, base local, exportación a Word y «Mis documentos» (api, ui, lib).
- `account/`: sesión, login y saldo de créditos (documents, api, ui, lib, contracts).
- `api/`: Firebase Auth, cliente tipado, errores y hooks en `queries/` (contracts, lib).
- `ui/`: componentes visuales y estilos (nada del proyecto).
- `lib/`: funciones puras, sin React (nada del proyecto).
- `contracts/`: tipos generados del OpenAPI, que no se editan (nada del proyecto).
- `docs/decisiones/`: ADRs del front.

## Convenciones

- Imports con `./` dentro de la misma carpeta o hacia abajo; todo lo demás con `@/`.
- Carpetas en inglés y con guiones; componentes `PascalCase.tsx`; hooks `useAlgo.ts`; el resto `camelCase.ts`.
- Identificadores en inglés; los campos de la API quedan como en el contrato, en español.
- Textos de la interfaz en español de Chile.
- Sin archivos barril, salvo el `index.ts` de cada actividad.
- Una carpeta se crea cuando tiene contenido.
- Sin secretos en el repo: la configuración local va en `.env.local`.

## Git

- Rama principal `main`. La CI corre en cada push a `main` y en cada PR.
- Commits con Conventional Commits, en español: `feat: …`, `fix: …`, `chore: …`.
- Sin líneas de atribución a Claude en commits ni en PR (`attribution` vacío en `.claude/settings.json`).
- `git commit` y `git push` piden confirmación; el push forzado y `--no-verify` están bloqueados.
- No se cambian sin acordarlo con el equipo: `.oxlintrc.json`, `.claude/`, este archivo y `src/contracts/` (salvo con `npm run contracts`).

## Dónde vive cada instrucción

| Si la instrucción… | Va en |
| --- | --- |
| Aplica a todo el repo | Este archivo, de 200 líneas como máximo (lo comprueba la CI) |
| Aplica a una carpeta o a un tipo de archivo | `.claude/rules/<tema>.md`, con `paths` |
| Es un procedimiento con pasos | `.claude/skills/<skill>/SKILL.md` |
| Produce mucho ruido y solo importa la conclusión | `.claude/agents/<agente>.md` |
| No debe depender del criterio del modelo | Un permiso en `.claude/settings.json` o un hook en `.claude/hooks/` |
| Ya la verifica una herramienta | Una línea que nombra la herramienta |
| Explica el porqué de una decisión | `docs/decisiones/` |
| Es solo tuya | `CLAUDE.local.md` o `.claude/settings.local.json`, ignorados por Git |

Hoy hay rules para `activities`, `api`, `documents`, `ui` y `pruebas`, y skills
`nueva-actividad` y `actualizar-contrato`.
