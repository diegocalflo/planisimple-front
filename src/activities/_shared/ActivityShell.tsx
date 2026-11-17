import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { usePrices } from '@/api/queries/prices'
import { useWallet } from '@/api/queries/wallet'
import { getDocument } from '@/documents/db'
import { downloadBlob } from '@/documents/export/download'
import { formatCredits, safeFileName } from '@/lib/format'
import { Button } from '@/ui/Button'
import { Notice } from '@/ui/Notice'
import { Spinner } from '@/ui/Spinner'
import type { ActivityDefinition, ActivityEntry, ActivityResult } from './definition'
import { GenerationStatus } from './GenerationStatus'
import { useGeneration } from './useGeneration'

interface ShellProps {
  entry: ActivityEntry
  definition: ActivityDefinition
}

/** Patrón común: formulario con su costo, generación y, al terminar, el documento con su descarga. */
export function ActivityShell({ entry, definition }: ShellProps) {
  const { documentId } = useParams()
  return documentId ? (
    <SavedDocument key={documentId} entry={entry} definition={definition} documentId={documentId} />
  ) : (
    <NewGeneration entry={entry} definition={definition} />
  )
}

function NewGeneration({ entry, definition }: ShellProps) {
  const navigate = useNavigate()
  const generation = useGeneration()
  const prices = usePrices()
  const wallet = useWallet()
  const cost = prices.data?.costos[entry.apiActivity]
  const { phase, documentId } = generation

  useEffect(() => {
    if (phase === 'saved' && documentId) navigate(`/actividades/${entry.id}/${documentId}`, { replace: true })
  }, [phase, documentId, entry.id, navigate])

  const busy = !['idle', 'failed', 'cancelled', 'error'].includes(phase)
  const { Form } = definition

  return (
    <section>
      <header className="page-header">
        <h1>{entry.title}</h1>
        {cost !== undefined && (
          <span className="muted">
            Usa {formatCredits(cost)}
            {wallet.data && ` · tienes ${formatCredits(wallet.data.saldoDisponible)}`}
          </span>
        )}
      </header>
      <GenerationStatus generation={generation} />
      <Form
        disabled={busy}
        onSubmit={(params) => generation.start({ activityId: entry.id, title: definition.documentTitle(params), params })}
      />
    </section>
  )
}

function SavedDocument({ entry, definition, documentId }: ShellProps & { documentId: string }) {
  // undefined mientras carga; 'missing' si no está en este navegador.
  const stored = useLiveQuery(async () => (await getDocument(documentId)) ?? 'missing', [documentId])
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(false)

  if (stored === undefined) return <Spinner label="Abriendo el documento" />
  if (stored === 'missing' || stored.activityId !== entry.id) {
    return (
      <Notice tone="error">
        No encontramos este documento en este navegador. <Link to="/">Volver a Mis documentos</Link>
      </Notice>
    )
  }

  // `documents` guarda el contenido sin tipo; esta actividad es la que lo generó.
  const result = stored.content as ActivityResult
  const { Viewer } = definition

  async function download(title: string) {
    setExporting(true)
    setExportError(false)
    try {
      downloadBlob(await definition.exportDocx(title, result), `${safeFileName(title)}.docx`)
    } catch {
      setExportError(true)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section>
      <header className="page-header">
        <h1>{stored.title}</h1>
        <div className="actions">
          <Button onClick={() => void download(stored.title)} disabled={exporting}>
            {exporting ? 'Preparando Word…' : 'Descargar Word'}
          </Button>
          <Link to={`/actividades/${entry.id}`}>Nueva generación</Link>
        </div>
      </header>
      {exportError && <Notice tone="error">No pudimos generar el Word. Inténtalo de nuevo.</Notice>}
      <Viewer result={result} />
    </section>
  )
}
