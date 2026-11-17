/**
 * Documento guardado en el navegador. `documents` no conoce las actividades:
 * `content` y `params` los tipa la actividad que lo generó.
 */
export interface StoredDocument<Content = unknown, Params = unknown> {
  /** También es el `documentoClienteId` enviado al servidor. */
  id: string
  /** Id de la actividad de origen en `activities/registry`. */
  activityId: string
  title: string
  params: Params
  content: Content
  version: number
  generationId: string
  createdAt: string
  updatedAt: string
}

/** Bloques neutros que una actividad produce desde su contenido para verlo y exportarlo. */
export type DocumentBlock =
  | { kind: 'heading'; text: string; level: 1 | 2 | 3 }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; headers: string[]; rows: string[][] }
