import { useWallet } from '@/api/queries/wallet'
import { formatCredits } from '@/lib/format'

export function CreditBalance() {
  const wallet = useWallet()
  if (!wallet.data) return null
  return <span aria-label="Saldo de créditos">{formatCredits(wallet.data.saldoDisponible)}</span>
}
