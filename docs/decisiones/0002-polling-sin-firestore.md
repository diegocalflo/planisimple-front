# ADR 0002: Estado de las generaciones por polling, sin Firestore en el navegador

## Estado

Aceptada el 2026-11-16. Sigue el ADR 0002 del backend.

## Contexto

La nota «Estructura de la aplicación» del vault proponía `api/listeners.ts`, con el
SDK de Firestore, para escuchar el saldo y el trabajo activo. El backend niega todo
acceso cliente en `firestore.rules` y define polling HTTP con espera creciente.

## Decisión

- El navegador solo usa Firebase Auth, en `src/api/auth.ts`.
- `useGenerationJob` consulta `GET /v1/generaciones/{id}` con la secuencia
  `sugerenciaPollingSegundos` (2, 3, 5 y 8 s, y luego 10 s) hasta un estado final.
- El saldo se refresca invalidando su consulta al crear una generación y al terminarla.

## Consecuencias

- Hay unas pocas peticiones extra por generación, a cambio de unas reglas de
  Firestore cerradas.
- Si el equipo quiere tiempo real, el cambio empieza en las reglas y la API del
  backend, no en el front.
