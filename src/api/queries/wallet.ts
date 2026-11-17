import { useQuery } from '@tanstack/react-query'
import type { paths } from '@/contracts/openapi'
import { api, unwrap } from '@/api/client'

export type Wallet = paths['/v1/billetera']['get']['responses'][200]['content']['application/json']

export const walletQueryKey = ['wallet'] as const

/** Saldo, lotes y reservas. Se invalida al crear o terminar una generación. */
export function useWallet() {
  return useQuery({
    queryKey: walletQueryKey,
    queryFn: async (): Promise<Wallet> => unwrap(await api.GET('/v1/billetera')),
  })
}
