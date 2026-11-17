import type { components } from '@/contracts/openapi'

type PublicError = components['schemas']['ErrorPublico']['error']

function isPublicErrorBody(body: unknown): body is { error: PublicError } {
  if (typeof body !== 'object' || body === null || !('error' in body)) return false
  const error = (body as { error: unknown }).error
  return typeof error === 'object' && error !== null && 'codigo' in error && 'mensaje' in error
}

/** Error público del backend: `{ error: { codigo, mensaje, detalles?, idSolicitud } }`. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown
  /** Se muestra a la docente para que lo cite al pedir soporte. */
  readonly requestId: string | undefined

  constructor(status: number, body: unknown) {
    const error = isPublicErrorBody(body) ? body.error : undefined
    super(error?.mensaje ?? `Error HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = error?.codigo ?? 'ERROR_DESCONOCIDO'
    this.details = error?.detalles
    this.requestId = error?.idSolicitud
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
