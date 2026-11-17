import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { listDocuments } from '@/documents/db'
import { formatDateTime } from '@/lib/format'
import { Spinner } from '@/ui/Spinner'

export function DocumentsPage() {
  const documents = useLiveQuery(listDocuments, [])

  return (
    <section>
      <h1>Mis documentos</h1>
      <p className="muted">Se guardan solo en este navegador.</p>
      {documents === undefined ? (
        <Spinner label="Cargando documentos" />
      ) : documents.length === 0 ? (
        <p>Aún no tienes documentos. Elige una actividad para crear el primero.</p>
      ) : (
        <ul className="document-list">
          {documents.map((document) => (
            <li key={document.id}>
              <Link to={`/actividades/${document.activityId}/${document.id}`}>{document.title}</Link>
              <span className="muted">{formatDateTime(document.updatedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
