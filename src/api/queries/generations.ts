import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { paths } from '@/contracts/openapi'
import { api, unwrap } from '@/api/client'
import { isApiError } from '@/api/errors'
import { walletQueryKey } from '@/api/queries/wallet'
import { pollingDelaySeconds } from '@/lib/pollingDelay'

type Generations = paths['/v1/generaciones']['post']
type Generation = paths['/v1/generaciones/{id}']['get']
type Result = paths['/v1/generaciones/{id}/resultado']['get']

export type GenerationInput = NonNullable<Generations['requestBody']>['content']['application/json']
export type GenerationJob = Generation['responses'][200]['content']['application/json']['trabajo']
export type GenerationState = GenerationJob['estado']
export type GenerationResult = Result['responses'][200]['content']['application/json']['resultado']

const TERMINAL_STATES: readonly GenerationState[] = ['exitoso', 'fallido', 'cancelado']

export function isTerminal(state: GenerationState): boolean {
  return TERMINAL_STATES.includes(state)
}

interface CreateVariables {
  input: GenerationInput
  /** UUID por intento de envío; los reintentos reusan el mismo. */
  idempotencyKey: string
}

export function useCreateGeneration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ input, idempotencyKey }: CreateVariables) =>
      unwrap(
        await api.POST('/v1/generaciones', {
          body: input,
          params: { header: { 'idempotency-key': idempotencyKey } },
        }),
      ),
    // Solo se reintentan fallas de red: la clave de idempotencia evita duplicar el trabajo.
    retry: (failureCount, error) => !isApiError(error) && failureCount < 2,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletQueryKey }),
  })
}

/** Estado del trabajo, con polling según la secuencia sugerida hasta un estado final. */
export function useGenerationJob(jobId: string | null, schedule: readonly number[]) {
  return useQuery({
    queryKey: ['generation', jobId],
    queryFn: async (): Promise<GenerationJob> =>
      unwrap(await api.GET('/v1/generaciones/{id}', { params: { path: { id: jobId ?? '' } } })).trabajo,
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const job = query.state.data
      if (query.state.status === 'error' || (job && isTerminal(job.estado))) return false
      return pollingDelaySeconds(query.state.dataUpdateCount, schedule) * 1000
    },
  })
}

export function useCancelGeneration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (jobId: string) =>
      unwrap(await api.POST('/v1/generaciones/{id}/cancelacion', { params: { path: { id: jobId } } })),
    onSuccess: (_data, jobId) => queryClient.invalidateQueries({ queryKey: ['generation', jobId] }),
  })
}

interface CollectVariables {
  jobId: string
  /** Guarda el resultado en el navegador. Debe terminar antes de confirmar. */
  persist: (result: GenerationResult) => Promise<unknown>
}

/**
 * Recoge el resultado, lo persiste y después confirma la entrega, que borra
 * el contenido en el servidor. El orden es obligatorio según el backend.
 */
export function useCollectGeneration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, persist }: CollectVariables) => {
      const path = { params: { path: { id: jobId } } }
      const { resultado } = unwrap(await api.GET('/v1/generaciones/{id}/resultado', path))
      await persist(resultado)
      try {
        unwrap(await api.POST('/v1/generaciones/{id}/confirmacion', path))
      } catch {
        // El documento ya está guardado; si la confirmación falla, el servidor
        // borra el contenido igual al vencer su hora de vida.
      }
      return resultado
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: walletQueryKey }),
  })
}
