# CLAUDE.md

Frontend de PlaniSimple: React 19 + TypeScript + Vite. Habla con el backend
(repo `planisimple-back`) solo por su API HTTP; de Firebase usa únicamente Auth.

## Comandos

- `npm ci` — instala lo fijado en el lockfile.
- `npm run dev` — servidor local en `http://localhost:5173` (el origen que el backend permite en CORS).
- `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` — lo mismo que corre la CI.
- `npm run contracts` — regenera `src/contracts/openapi.d.ts` desde
  `../planisimple-back/docs/api/openapi.json` (otra ruta con `OPENAPI=...`). No se edita a mano.

Verificación obligatoria tras cambios: lint, typecheck, test y build.

## Estructura

```
src/
  app/          arranque, rutas, proveedores, layouts y guardas
  activities/   registry.ts, _shared/ (shell, useGeneration) y una carpeta por actividad
  documents/    modelo del documento, base local (Dexie), exportación a Word y «Mis documentos»
  account/      sesión, login y saldo de créditos
  api/          auth (Firebase), cliente tipado, errores y hooks de TanStack Query en queries/
  ui/           componentes visuales y estilos, sin lógica de negocio
  lib/          funciones puras, sin React
  contracts/    tipos generados del OpenAPI del backend
```

Una carpeta se crea cuando tiene contenido: `admin/` y `activities/_shared/attachments/`
aparecen cuando haya panel o adjuntos.

## Reglas de dependencias

Las impone oxlint (`.oxlintrc.json`); un import prohibido rompe el lint y la CI.

| Carpeta | Puede importar |
| --- | --- |
| `ui`, `lib`, `contracts` | Nada del proyecto |
| `api` | `contracts` y `lib` |
| `documents` | `api`, `ui` y `lib` |
| `activities`, `account`, `admin` | `documents`, `api`, `ui`, `lib` y `contracts` |
| `app` | Todo, pero cada actividad solo a través de `activities/registry` |

- Las actividades no se importan entre sí; lo común sube a `activities/_shared` o a `documents`.
- `account` y `admin` no se importan entre sí ni importan actividades.
- Imports con `./` dentro de la misma carpeta o hacia abajo; todo lo demás con `@/`. Nunca `../`.
- No hay archivos barril, salvo el `index.ts` de cada actividad.

## Cómo funciona una actividad

1. `registry.ts` lista cada actividad: id, id del contrato (`apiActivity`), título, categoría,
   entrega y su `import()` diferido.
2. `app/router.tsx` crea una ruta `actividades/<id>/:documentId?` por entrada. El shell y la
   actividad, con docx, se descargan al entrar.
3. El `index.ts` de la actividad exporta su `ActivityDefinition`: `Form`, `Viewer`, `exportDocx`
   y `documentTitle`.
4. `ActivityShell` muestra el costo, el formulario y el estado; con `documentId` muestra el
   documento guardado y su descarga.
5. `useGeneration` crea el trabajo, hace polling, permite cancelar, guarda el resultado en
   Dexie y **después** confirma la entrega.
6. `Viewer` y `exporter` parten de los mismos bloques (`blocks.ts` → `DocumentBlock[]`), así la
   pantalla y el Word muestran lo mismo.

### Cómo se añade una actividad

1. Que el backend la tenga en su contrato; luego `npm run contracts`.
2. Crea `src/activities/<id>/`, en inglés y con guiones, con `Form.tsx`, `Viewer.tsx`,
   `exporter.ts` e `index.ts`.
3. Añade su entrada en `registry.ts`. No se toca `router.tsx` ni otra actividad.

## Datos del servidor

- Toda llamada pasa por `api/client.ts`, que añade el ID token de Firebase. Los componentes
  usan los hooks de `api/queries/`, nunca el cliente.
- `POST /v1/generaciones` lleva `Idempotency-Key` (UUID por intento; los reintentos lo reusan).
- Estado por polling con la secuencia que sugiere el backend (2, 3, 5, 8 y luego 10 s).
- El resultado se persiste en el navegador antes de `POST .../confirmacion`, que lo borra del servidor.
- Errores: `ApiError` con `code` e `requestId`; el `requestId` se muestra para soporte.
- El navegador nunca toca Firestore: el backend lo niega todo al cliente.

## Convenciones

- Carpetas en inglés y con guiones; componentes `PascalCase.tsx`; hooks `useAlgo.ts`; el resto `camelCase.ts`.
- Identificadores en inglés; los campos de la API se quedan como los define el contrato (español).
- Textos de la interfaz en español de Chile.
- Pruebas junto al archivo que prueban (`Form.test.tsx`), con Vitest y Testing Library.
- Sin secretos en el repo: la configuración va en `.env.local` (ver `.env.example`).

## Diferencias con la nota de arquitectura del vault

- Front y back son repos separados: el código vive en `src/` y `packages/contracts` se
  reemplaza por los tipos generados en `src/contracts/`.
- Cliente `openapi-fetch` en vez de `hc`: ADR 0004 del backend, pendiente de decisión conjunta.
- Sin `api/listeners.ts`: el backend usa polling y niega Firestore al cliente (ADR 0002 del backend).
