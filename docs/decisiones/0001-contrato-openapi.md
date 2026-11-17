# ADR 0001: Contrato por OpenAPI generado y cliente openapi-fetch

## Estado

Aceptada en el front el 2026-11-16. El uso de `hc` sigue pendiente de una decisión
conjunta (ADR 0004 del backend).

## Contexto

La nota «Estructura de la aplicación» del vault supone un monorepo con
`packages/contracts`, esquemas Zod compartidos y un cliente `hc` de Hono. Front y
back viven en repos separados, y el backend publica un OpenAPI determinista en
`docs/api/openapi.json`, que su CI revisa.

## Decisión

- `src/contracts/openapi.d.ts` se genera con openapi-typescript (`npm run contracts`)
  y se versiona, así la CI del front no necesita el backend.
- El cliente es `openapi-fetch`, con un middleware que añade el ID token de Firebase.
- `src/contracts/` cumple el papel de `packages/contracts` en las reglas de dependencias.

## Consecuencias

- No hay esquemas Zod en tiempo de ejecución: la validación fina la hace el backend,
  que responde 422 con `detalles`.
- Las respuestas que el OpenAPI no describe se tipan a mano y se marcan para borrar;
  hoy es `GET /v1/precios`.
- openapi-typescript pide TypeScript 5 y el proyecto usa 7: el script lo corre con
  `npx` y una versión fija, fuera de las dependencias.
