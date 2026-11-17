---
name: actualizar-contrato
description: Regenera los tipos de la API desde el OpenAPI del backend y adapta el front a los cambios. Usar cuando digan "actualizar contrato", "cambió la API", "regenerar tipos", "Diego cambió el backend" o tras un cambio en docs/api/openapi.json del backend.
allowed-tools: Read, Grep, Glob, Edit, Bash(git -C ../planisimple-back pull*), Bash(git -C ../planisimple-back log*), Bash(npm run contracts*), Bash(npm run lint*), Bash(npm run typecheck*), Bash(npm test*), Bash(npm run build*), Bash(git diff*)
---
1. Trae lo último del backend: `git -C ../planisimple-back pull --ff-only`. Si falla, o el backend está en otra ruta, detente y pregunta por la ruta o la rama.
2. Corre `npm run contracts`, o `OPENAPI=<ruta> npm run contracts` si el backend está en otro lugar.
3. Mira `git diff --stat src/contracts/openapi.d.ts`. Sin cambios, termina aquí.
4. Corre `npm run typecheck`: cada error es un uso afectado. Corrige primero `src/api/queries/`, después `activities/` y `account/`.
5. Revisa los tipos escritos a mano que el contrato ya pueda cubrir. Hoy es `Prices` en `src/api/queries/prices.ts`: si el OpenAPI ya describe `GET /v1/precios`, bórralo y usa el tipo generado.
6. Corre `npm run lint`, `npm test` y `npm run build`.
7. Resume: endpoints y campos que cambiaron, archivos ajustados y lo que conviene avisarle a Diego.
