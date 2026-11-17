---
paths:
  - "src/activities/**"
---
# Actividades

- El `index.ts` de cada actividad exporta por defecto un `ActivityDefinition` (`_shared/definition.ts`): `Form`, `Viewer`, `exportDocx` y `documentTitle`. Es su única entrada pública.
- `Form` entrega `ActivityParams` por `onSubmit`. No pone `documentoClienteId` ni llama a mutaciones de la API; solo usa hooks de lectura como `useCatalog`.
- Crear, consultar, cancelar, guardar y confirmar una generación pasa solo por `_shared/useGeneration`. Una actividad no importa `api/queries/generations`.
- `Viewer` y `exporter` parten de la misma función `toBlocks` de la actividad; el Word nunca se arma desde el DOM.
- El estado de una actividad vive en su ruta; lo que persiste es el documento guardado en `documents`.
- Una actividad nueva se añade con la skill `nueva-actividad`, sin tocar `app/router.tsx` ni otras actividades.
- Los imports entre actividades los rechaza oxlint.
