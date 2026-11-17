---
name: nueva-actividad
description: Añade una actividad a la app (carpeta en src/activities con Form, Viewer, exporter e index, sus pruebas y su entrada en el registro). Usar cuando pidan "nueva actividad", "agregar un módulo", "sumar planificación clase a clase" u otro tipo de documento que genere la app.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(npm run lint*), Bash(npm run typecheck*), Bash(npm test*), Bash(npm run build*), Bash(npx vitest *)
---
1. Busca el id de la actividad en `src/contracts/openapi.d.ts`, en el enum `actividad` del cuerpo de `POST /v1/generaciones`. Si no está, detente: primero va en el backend y después se corre la skill `actualizar-contrato`.
2. Si el contrato ya tiene más de una actividad, convierte `ActivityParams` y `ActivityResult` de `src/activities/_shared/definition.ts` en uniones antes de seguir, y corre `npm run typecheck`.
3. Elige el id de la carpeta, en inglés y con guiones (`class-planning`), y anota el id del contrato para `apiActivity`.
4. Crea `src/activities/<id>/` con el patrón de `unit-planning`:
   - `labels.ts`: textos de la interfaz para los valores del contrato.
   - `blocks.ts`: `toBlocks(resultado) → DocumentBlock[]`, el único mapeo del resultado.
   - `Form.tsx`: entrega `ActivityParams` por `onSubmit`.
   - `Viewer.tsx`: `<BlocksView blocks={toBlocks(result)} />`.
   - `exporter.ts`: `blocksToDocx(title, toBlocks(result))`.
   - `index.ts`: `export default` del `ActivityDefinition`.
5. Escribe `Form.test.tsx` y `blocks.test.ts` según la rule de pruebas.
6. Añade la entrada en `src/activities/registry.ts` (`id`, `apiActivity`, `title`, `category`, `release`, `load`). No toques `app/router.tsx` ni otras actividades.
7. Corre `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`. En la salida del build debe aparecer un chunk propio de la actividad.
8. Resume: id y ruta nuevas, campos del formulario y qué del resultado quedó sin mostrar, si algo quedó.
