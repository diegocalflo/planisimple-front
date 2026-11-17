---
paths:
  - "src/ui/**"
---
# UI

- Sin lógica de negocio ni llamadas a la API; oxlint rechaza cualquier import del proyecto.
- Colores y espacios salen de las variables de `styles.css`. Toda variable de color tiene también su valor en el bloque `prefers-color-scheme: dark`.
- Todo control tiene nombre accesible: `Field` envuelve el control con su `label`, y los errores usan `Notice tone="error"` (role `alert`).
- Un componente pasa a `ui/` cuando lo usa una segunda carpeta y no tiene lógica de negocio.
