---
paths:
  - "src/documents/**"
---
# Documentos

- `documents` no conoce actividades: `StoredDocument.content` y `params` son `unknown` y los tipa la actividad que los generó.
- Cambiar las tablas o los índices de Dexie exige una `db.version(n + 1)` con su migración; una versión publicada no se edita.
- `export/docx.ts` solo lo importan los `exporter.ts` de las actividades, para que docx viaje en sus chunks diferidos. Tras tocarlo, comprueba en `npm run build` que no aparece en el chunk `index-*.js`.
- Los documentos viven solo en el navegador: nada de `documents` envía su contenido a la API.
