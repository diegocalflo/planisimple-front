import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Form } from './Form'

vi.mock('@/api/queries/catalog', () => ({
  useCatalog: () => ({
    isPending: false,
    isError: false,
    data: {
      cursos: ['1° medio', '2° medio'],
      asignaturas: ['Lengua y Literatura', 'Historia'],
      modelosPlanificacion: ['diseno_inverso', 'sabana', 'modelo_t', 'abp'],
      periodos: ['semestral', 'anual'],
      actividades: ['planificacion'],
    },
  }),
}))

afterEach(cleanup)

describe('Form de planificación de unidades', () => {
  it('entrega la entrada de la API con las unidades numeradas y los objetivos separados', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Form disabled={false} onSubmit={onSubmit} />)

    await user.selectOptions(screen.getByLabelText('Curso'), '2° medio')
    await user.selectOptions(screen.getByLabelText('Asignatura'), 'Historia')
    await user.selectOptions(screen.getByLabelText('Modelo de planificación'), 'sabana')
    const unit = within(screen.getByRole('group', { name: 'Unidad 1' }))
    await user.type(unit.getByLabelText('Nombre'), 'Revolución industrial')
    await user.type(unit.getByLabelText(/Objetivos de aprendizaje/), 'OA 1, OA 3;OA 5')
    await user.clear(unit.getByLabelText('Semanas'))
    await user.type(unit.getByLabelText('Semanas'), '6')
    await user.click(screen.getByRole('button', { name: 'Generar' }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      actividad: 'planificacion',
      periodo: 'semestral',
      semestre: 1,
      curso: '2° medio',
      asignatura: 'Historia',
      modeloPlanificacion: 'sabana',
      unidades: [{ numero: 1, nombre: 'Revolución industrial', objetivos: ['OA 1', 'OA 3', 'OA 5'], semanas: 6 }],
      contieneDatosEstudiantes: false,
      declaraMinimizacion: false,
    })
    expect(onSubmit.mock.calls[0]?.[0]).not.toHaveProperty('foco')
  })

  it('pide declarar la minimización solo cuando hay datos de estudiantes', async () => {
    const user = userEvent.setup()
    render(<Form disabled={false} onSubmit={vi.fn()} />)

    expect(screen.queryByLabelText(/datos de estudiantes estrictamente necesarios/)).toBeNull()
    await user.click(screen.getByLabelText('El contenido incluye datos de estudiantes'))
    expect(screen.getByLabelText(/datos de estudiantes estrictamente necesarios/)).toHaveProperty('required', true)
  })

  it('permite hasta 4 unidades en semestral y 8 en anual', async () => {
    const user = userEvent.setup()
    render(<Form disabled={false} onSubmit={vi.fn()} />)

    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: 'Añadir unidad' }))
    expect(screen.queryByRole('button', { name: 'Añadir unidad' })).toBeNull()
    await user.selectOptions(screen.getByLabelText('Periodo'), 'anual')
    expect(screen.getByRole('button', { name: 'Añadir unidad' })).toBeTruthy()
  })
})
