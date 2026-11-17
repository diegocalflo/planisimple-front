const numberFormat = new Intl.NumberFormat('es-CL')
const dateTimeFormat = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' })

export function formatCredits(amount: number): string {
  return amount === 1 ? '1 crédito' : `${numberFormat.format(amount)} créditos`
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

/** Quita los caracteres que los sistemas de archivos no aceptan en un nombre. */
export function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'documento'
}
