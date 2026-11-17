import { describe, expect, it } from 'vitest'
import type { ActivityResult } from '@/activities/_shared/definition'
import { toBlocks } from './blocks'

const sheet: ActivityResult = {
  versionEsquema: 'planificacion-v1',
  actividad: 'planificacion',
  periodo: 'semestral',
  advertencias: [],
  modeloPlanificacion: 'sabana',
  filas: [
    {
      mes: 'Marzo',
      semana: 1,
      semestre: 1,
      unidad: 1,
      objetivosAprendizaje: ['OA 1', 'OA 2'],
      objetivosActitudinales: [],
      contenido: 'Lectura comprensiva',
      actividad: 'Lectura guiada',
    },
  ],
  resumenAdecuaciones: { acceso: ['Texto ampliado'], noSignificativas: [], significativas: [] },
  estrategiasFormativas: [],
}

describe('toBlocks', () => {
  it('convierte una sábana en tabla y omite las secciones vacías', () => {
    const blocks = toBlocks(sheet)

    expect(blocks[0]).toEqual({ kind: 'paragraph', text: 'Sábana · Semestral' })
    const table = blocks.find((block) => block.kind === 'table')
    expect(table).toMatchObject({
      rows: [['1', 'Marzo', '1', '1', 'OA 1, OA 2', 'Lectura comprensiva', 'Lectura guiada', '', '', '']],
    })
    const headings = blocks.filter((block) => block.kind === 'heading').map((block) => block.text)
    expect(headings).toEqual(['Planificación', 'Adecuaciones', 'De acceso'])
  })
})
