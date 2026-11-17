import { isApiError } from '@/api/errors'
import { Button } from '@/ui/Button'
import { Notice } from '@/ui/Notice'
import { Spinner } from '@/ui/Spinner'
import type { GenerationController } from './useGeneration'

const MESSAGES_BY_CODE: Record<string, string> = {
  CREDITOS_INSUFICIENTES: 'No tienes créditos suficientes para esta generación.',
  LIMITE_TRABAJOS_ACTIVOS: 'Ya tienes el máximo de generaciones en curso. Espera a que termine una.',
  DOCUMENTO_OCUPADO: 'Este documento ya tiene una generación en curso.',
  ACEPTACION_LEGAL_REQUERIDA: 'Debes aceptar los términos y la política de privacidad antes de generar.',
  RESULTADO_EXPIRADO: 'El resultado venció antes de guardarse. Vuelve a generarlo.',
  NO_AUTORIZADO: 'Tu sesión venció. Vuelve a ingresar.',
}

function errorMessage(error: Error): { text: string; requestId?: string } {
  if (!isApiError(error)) return { text: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.' }
  return { text: MESSAGES_BY_CODE[error.code] ?? error.message, requestId: error.requestId }
}

export function GenerationStatus({ generation }: { generation: GenerationController }) {
  const { phase, error } = generation
  const cancelButton = generation.canCancel && (
    <Button variant="secondary" onClick={generation.cancel} disabled={generation.isCancelling}>
      Cancelar
    </Button>
  )

  switch (phase) {
    case 'idle':
    case 'saved':
      return null
    case 'creating':
      return <Spinner label="Enviando" />
    case 'queued':
      return (
        <div className="actions">
          <Spinner label="En cola" />
          {cancelButton}
        </div>
      )
    case 'processing':
      return (
        <div className="actions">
          <Spinner label="Generando tu documento; puede tardar unos minutos" />
          {cancelButton}
        </div>
      )
    case 'collecting':
      return <Spinner label="Guardando el documento en este navegador" />
    case 'failed':
      return <Notice tone="error">La generación falló. Puedes intentarlo de nuevo.</Notice>
    case 'cancelled':
      return <Notice>Cancelaste la generación.</Notice>
    case 'error': {
      const { text, requestId } = errorMessage(error ?? new Error())
      return (
        <Notice tone="error">
          {text}
          {requestId && <span className="muted"> Código para soporte: {requestId}</span>}
        </Notice>
      )
    }
  }
}
