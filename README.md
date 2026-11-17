# PlaniSimple Frontend

Aplicación web de PlaniSimple: React + TypeScript con Vite. Consume la API del
backend ([planisimple-back](https://github.com/diegocalflo/planisimple-back)) y
usa Firebase solo para iniciar sesión.

## Requisitos

- Node 22 o 24 y npm.
- Para trabajar contra el backend local: sus emuladores con Docker
  (ver `docs/desarrollo-local.md` del backend).

## Primeros pasos

```bash
npm ci
cp .env.example .env.local   # valores para los emuladores del backend
npm run dev                  # http://localhost:5173
```

Con los emuladores del backend sembrados, el usuario de prueba es
`docente.prueba@planisimple.local` / `prueba-local-123`.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo. |
| `npm run lint` | oxlint, incluidas las reglas de dependencias entre carpetas. |
| `npm run typecheck` | `tsc -b` sobre la app y la configuración. |
| `npm test` | Pruebas con Vitest. |
| `npm run build` | Typecheck y build de producción en `dist/`. |
| `npm run contracts` | Regenera los tipos de la API desde el OpenAPI del backend. |

## Documentación

- `CLAUDE.md` — estructura, comandos, convenciones y dónde vive cada instrucción para Claude Code.
- `.claude/` — rules, skills, hooks y permisos de Claude Code. Se activan al abrir Claude Code en esta carpeta.
- `docs/decisiones/` — decisiones de arquitectura del front.
- `docs/integracion-frontend.md` del backend — contrato y flujo de la API.
