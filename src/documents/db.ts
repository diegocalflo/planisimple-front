import Dexie, { type EntityTable } from 'dexie'
import type { StoredDocument } from '@/documents/model'

// Base local: los documentos viven solo en este navegador.

const db = new Dexie('planisimple') as Dexie & {
  documents: EntityTable<StoredDocument, 'id'>
}

db.version(1).stores({
  documents: 'id, activityId, updatedAt',
})

export function saveDocument<Content, Params>(document: StoredDocument<Content, Params>): Promise<string> {
  return db.documents.put(document)
}

export function getDocument(id: string): Promise<StoredDocument | undefined> {
  return db.documents.get(id)
}

/** Todos los documentos, del más reciente al más antiguo. */
export function listDocuments(): Promise<StoredDocument[]> {
  return db.documents.orderBy('updatedAt').reverse().toArray()
}
