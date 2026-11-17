import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  isTerminal,
  useCancelGeneration,
  useCollectGeneration,
  useCreateGeneration,
  useGenerationJob,
} from '@/api/queries/generations'
import { walletQueryKey } from '@/api/queries/wallet'
import { saveDocument } from '@/documents/db'
import { DEFAULT_POLLING_SCHEDULE } from '@/lib/pollingDelay'
import type { ActivityParams } from './definition'

export interface StartOptions {
  activityId: string
  title: string
  params: ActivityParams
}

interface ActiveJob {
  jobId: string
  documentId: string
  schedule: readonly number[]
  options: StartOptions
}

export type GenerationPhase =
  | 'idle'
  | 'creating'
  | 'queued'
  | 'processing'
  | 'collecting'
  | 'saved'
  | 'failed'
  | 'cancelled'
  | 'error'

/**
 * Crea el trabajo, sigue su estado, permite cancelarlo y, si termina bien,
 * guarda el resultado como documento local y confirma la entrega.
 */
export function useGeneration() {
  const queryClient = useQueryClient()
  const [active, setActive] = useState<ActiveJob | null>(null)
  const collectedJobId = useRef<string | null>(null)

  const create = useCreateGeneration()
  const cancel = useCancelGeneration()
  const collect = useCollectGeneration()
  const job = useGenerationJob(active?.jobId ?? null, active?.schedule ?? DEFAULT_POLLING_SCHEDULE)
  const state = job.data?.estado
  const { mutate: collectMutate } = collect

  useEffect(() => {
    if (!active || !state || !isTerminal(state)) return
    if (state !== 'exitoso') {
      // Fallido o cancelado: el backend libera la reserva de créditos.
      void queryClient.invalidateQueries({ queryKey: walletQueryKey })
      return
    }
    if (collectedJobId.current === active.jobId) return
    collectedJobId.current = active.jobId
    const now = new Date().toISOString()
    collectMutate({
      jobId: active.jobId,
      persist: (result) =>
        saveDocument({
          id: active.documentId,
          activityId: active.options.activityId,
          title: active.options.title,
          params: active.options.params,
          content: result,
          version: 1,
          generationId: active.jobId,
          createdAt: now,
          updatedAt: now,
        }),
    })
  }, [active, state, collectMutate, queryClient])

  function start(options: StartOptions) {
    collectedJobId.current = null
    setActive(null)
    cancel.reset()
    collect.reset()
    // El id del documento local viaja como documentoClienteId: un trabajo activo por documento.
    const documentId = crypto.randomUUID()
    create.mutate(
      { input: { ...options.params, documentoClienteId: documentId }, idempotencyKey: crypto.randomUUID() },
      {
        onSuccess: (created) =>
          setActive({ jobId: created.trabajoId, documentId, schedule: created.sugerenciaPollingSegundos, options }),
      },
    )
  }

  let phase: GenerationPhase = 'idle'
  if (create.isPending) phase = 'creating'
  else if (create.isError || job.isError || collect.isError) phase = 'error'
  else if (collect.isSuccess) phase = 'saved'
  else if (state === 'exitoso') phase = 'collecting'
  else if (state === 'fallido') phase = 'failed'
  else if (state === 'cancelado') phase = 'cancelled'
  else if (state === 'en_proceso') phase = 'processing'
  else if (active) phase = 'queued'

  const canCancel = phase === 'queued' || phase === 'processing'

  return {
    phase,
    error: create.error ?? job.error ?? collect.error ?? cancel.error ?? null,
    documentId: active?.documentId ?? null,
    start,
    canCancel,
    isCancelling: cancel.isPending,
    cancel: () => {
      if (active && canCancel) cancel.mutate(active.jobId)
    },
  }
}

export type GenerationController = ReturnType<typeof useGeneration>
