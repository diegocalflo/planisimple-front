# AGENTS.md

Frontend de PlaniSimple (React + TypeScript + Vite). Antes de trabajar:

1. Lee `CLAUDE.md`: proyecto, stack, comandos, estructura, convenciones y Git.
2. Aplica las reglas de `.claude/rules/` a los archivos de su `paths`. Otros agentes no
   cargan esa carpeta por su cuenta:
   - `activities.md`: `src/activities/**`
   - `api.md`: `src/api/**` y `src/contracts/**`
   - `documents.md`: `src/documents/**`
   - `ui.md`: `src/ui/**`
   - `pruebas.md`: `src/**/*.test.{ts,tsx}`
3. Los procedimientos con pasos están en `.claude/skills/`: añadir una actividad y
   actualizar el contrato con el backend.
4. El porqué de las decisiones está en `docs/decisiones/`.

Verificación obligatoria tras cambios: `npm run lint`, `npm run typecheck`, `npm test` y
`npm run build`.

Formato del reporte: qué cambió, cómo se verificó y qué quedó pendiente.
