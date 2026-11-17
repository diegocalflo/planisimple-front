import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '@/api/client'

/**
 * El OpenAPI aún no describe esta respuesta; el tipo copia `ConfigPrecios`
 * de `functions/src/dominio.ts` del backend. Quitarlo cuando el contrato lo incluya.
 */
export interface Prices {
  /** Créditos por actividad, con el id del contrato (`planificacion`, …). */
  costos: Record<string, number>
  limites: {
    trabajosActivos: number
    caracteresReferenciaTotal: number
    caracteresReferenciaBloque: number
  }
}

export function usePrices() {
  return useQuery({
    queryKey: ['prices'],
    queryFn: async () => unwrap(await api.GET('/v1/precios')) as unknown as Prices,
    staleTime: 10 * 60 * 1000,
  })
}
