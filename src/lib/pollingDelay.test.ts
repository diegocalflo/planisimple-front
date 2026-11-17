import { describe, expect, it } from 'vitest'
import { pollingDelaySeconds } from './pollingDelay'

describe('pollingDelaySeconds', () => {
  it('sigue la secuencia 2, 3, 5, 8 y se queda en 10', () => {
    expect([0, 1, 2, 3, 4, 5, 20].map((n) => pollingDelaySeconds(n))).toEqual([2, 3, 5, 8, 10, 10, 10])
  })

  it('usa la secuencia que sugiere el servidor', () => {
    expect(pollingDelaySeconds(1, [1, 4])).toBe(4)
    expect(pollingDelaySeconds(9, [1, 4])).toBe(4)
  })

  it('tolera intentos negativos y secuencias vacías', () => {
    expect(pollingDelaySeconds(-1)).toBe(2)
    expect(pollingDelaySeconds(0, [])).toBe(10)
  })
})
