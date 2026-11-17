import { useQuery } from '@tanstack/react-query'
import type { paths } from '@/contracts/openapi'
import { api, unwrap } from '@/api/client'

export type Session = paths['/v1/sesion']['post']['responses'][200]['content']['application/json']

/**
 * `POST /v1/sesion` tras cada login. Es idempotente: la primera vez crea el
 * perfil y la billetera con los créditos de bienvenida.
 */
export function useSession(uid: string | undefined) {
  return useQuery({
    queryKey: ['session', uid],
    queryFn: async (): Promise<Session> => unwrap(await api.POST('/v1/sesion')),
    enabled: uid !== undefined,
    staleTime: Infinity,
  })
}
