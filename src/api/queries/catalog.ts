import { useQuery } from '@tanstack/react-query'
import type { paths } from '@/contracts/openapi'
import { api, unwrap } from '@/api/client'

export type Catalog = paths['/v1/catalogo']['get']['responses'][200]['content']['application/json']

/** Cursos, asignaturas, modelos y periodos válidos para generar. */
export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: async (): Promise<Catalog> => unwrap(await api.GET('/v1/catalogo')),
    staleTime: 60 * 60 * 1000,
  })
}
