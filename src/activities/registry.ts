import type { ActivityEntry } from './_shared/definition'

/**
 * Catálogo de actividades. Es el único lugar que importa una actividad, y lo
 * hace con `import()` diferido: su código, con docx, se descarga al entrar a su ruta.
 * Para añadir una, ver «Cómo se añade una actividad» en CLAUDE.md.
 */
export const activities: readonly ActivityEntry[] = [
  {
    id: 'unit-planning',
    apiActivity: 'planificacion',
    title: 'Planificación de unidades',
    category: 'planning',
    release: 1,
    load: () => import('./unit-planning'),
  },
]
