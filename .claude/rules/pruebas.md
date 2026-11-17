---
paths:
  - "src/**/*.test.{ts,tsx}"
---
# Pruebas

- Vitest y Testing Library, en un archivo junto al que prueban.
- Los hooks de `api/queries` se reemplazan con `vi.mock('@/api/queries/<recurso>')`. Ninguna prueba toca red, Firebase ni IndexedDB.
- Se consulta por rol o etiqueta (`getByRole`, `getByLabelText`), no por clases ni `data-testid`.
- Las interacciones usan `userEvent.setup()`, no `fireEvent`.
- Las pruebas de componentes llevan `afterEach(cleanup)`: Vitest corre sin globals y Testing Library no limpia sola.
