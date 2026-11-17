/** Espera sugerida por el backend entre consultas de estado, en segundos. */
export const DEFAULT_POLLING_SCHEDULE: readonly number[] = [2, 3, 5, 8, 10]

const FALLBACK_SECONDS = 10

/**
 * Segundos que se esperan antes de la consulta número `attempt` (desde 0).
 * Pasado el final de la secuencia se repite el último valor.
 */
export function pollingDelaySeconds(
  attempt: number,
  schedule: readonly number[] = DEFAULT_POLLING_SCHEDULE,
): number {
  const index = Math.min(Math.max(attempt, 0), schedule.length - 1)
  return schedule[index] ?? FALLBACK_SECONDS
}
