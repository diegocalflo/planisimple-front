---
paths:
  - "src/api/**"
  - "src/contracts/**"
---
# API y contrato

- `src/contracts/openapi.d.ts` es generado: cambia solo con `npm run contracts` (skill `actualizar-contrato`), nunca a mano.
- Toda llamada usa `api` de `client.ts` y pasa por `unwrap()`, que lanza `ApiError` con `code` y `requestId`.
- Un recurso nuevo es un archivo en `queries/` con sus hooks de TanStack Query. Sus tipos salen de `paths[...]`, no se reescriben.
- Si otro módulo invalida una consulta, su query key se exporta junto a sus hooks (como `walletQueryKey`).
- `POST /v1/generaciones` lleva `Idempotency-Key` con un UUID por intento; los reintentos reusan la clave.
- El polling usa `pollingDelaySeconds` con la secuencia que devuelve el backend y se detiene en `exitoso`, `fallido` o `cancelado`.
- El resultado se guarda antes de `POST .../confirmacion`, que lo borra del servidor (`useCollectGeneration`).
- El SDK de Firebase se importa solo en `auth.ts`, y solo Auth; nunca `firebase/firestore`. Ver [ADR 0002](../../docs/decisiones/0002-polling-sin-firestore.md).
- Ni tokens, ni correos, ni contenido de documentos van a `console`.
