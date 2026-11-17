import type { ComponentType } from 'react'
import type { GenerationInput, GenerationResult } from '@/api/queries/generations'

/** Lo que entrega el formulario: la entrada de la API sin `documentoClienteId`, que pone el shell. */
export type ActivityParams = Omit<GenerationInput, 'documentoClienteId'>
export type ActivityResult = GenerationResult

export interface ActivityFormProps {
  disabled: boolean
  onSubmit: (params: ActivityParams) => void
}

/** Lo que exporta el `index.ts` de cada actividad. */
export interface ActivityDefinition {
  Form: ComponentType<ActivityFormProps>
  Viewer: ComponentType<{ result: ActivityResult }>
  /** Genera el Word desde el contenido del documento, nunca desde la pantalla. */
  exportDocx: (title: string, result: ActivityResult) => Promise<Blob>
  documentTitle: (params: ActivityParams) => string
}

export type ActivityCategory = 'planning' | 'assessment' | 'review' | 'inclusion'

/** Entrada del catálogo en `registry.ts`. No carga código de la actividad. */
export interface ActivityEntry {
  /** Nombre de la carpeta y segmento de la ruta, en inglés y con guiones. */
  id: string
  /** Id de la actividad en el contrato del backend. */
  apiActivity: GenerationInput['actividad']
  title: string
  category: ActivityCategory
  /** Entrega en la que se publica. */
  release: 1 | 2 | 3
  load: () => Promise<{ default: ActivityDefinition }>
}
