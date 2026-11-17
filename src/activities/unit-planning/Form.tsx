import { type FormEvent, useState } from 'react'
import type { ActivityFormProps, ActivityParams } from '@/activities/_shared/definition'
import { useCatalog } from '@/api/queries/catalog'
import { Button } from '@/ui/Button'
import { Field } from '@/ui/Field'
import { Notice } from '@/ui/Notice'
import { Spinner } from '@/ui/Spinner'
import { MAX_UNITS, MODEL_LABELS, PERIOD_LABELS } from './labels'

type Period = ActivityParams['periodo']
type Model = ActivityParams['modeloPlanificacion']

interface UnitDraft {
  key: number
  name: string
  objectives: string
  weeks: number
}

let nextUnitKey = 0
const newUnit = (): UnitDraft => ({ key: nextUnitKey++, name: '', objectives: '', weeks: 4 })

/** «OA 1, OA 3; OA 5» → ['OA 1', 'OA 3', 'OA 5'] */
function splitList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function Form({ disabled, onSubmit }: ActivityFormProps) {
  const catalog = useCatalog()
  const [period, setPeriod] = useState<Period>('semestral')
  const [semester, setSemester] = useState<1 | 2>(1)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [course, setCourse] = useState('')
  const [subject, setSubject] = useState('')
  const [model, setModel] = useState<Model>('diseno_inverso')
  const [units, setUnits] = useState<UnitDraft[]>(() => [newUnit()])
  const [focus, setFocus] = useState('')
  const [hasStudentData, setHasStudentData] = useState(false)
  const [minimizationDeclared, setMinimizationDeclared] = useState(false)

  if (catalog.isPending) return <Spinner label="Cargando cursos y asignaturas" />
  if (catalog.isError) return <Notice tone="error">No pudimos cargar cursos y asignaturas. Recarga la página.</Notice>

  const models = (Object.keys(MODEL_LABELS) as Model[]).filter((m) => catalog.data.modelosPlanificacion.includes(m))
  const periods = (Object.keys(PERIOD_LABELS) as Period[]).filter((p) => catalog.data.periodos.includes(p))
  const maxUnits = MAX_UNITS[period]

  function updateUnit(key: number, patch: Partial<UnitDraft>) {
    setUnits((list) => list.map((unit) => (unit.key === key ? { ...unit, ...patch } : unit)))
  }

  function changePeriod(next: Period) {
    setPeriod(next)
    setUnits((list) => list.slice(0, MAX_UNITS[next]))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      actividad: 'planificacion',
      periodo: period,
      anio: year,
      ...(period === 'semestral' ? { semestre: semester } : {}),
      curso: course,
      asignatura: subject,
      modeloPlanificacion: model,
      unidades: units.map((unit, index) => ({
        numero: index + 1,
        nombre: unit.name.trim(),
        objetivos: splitList(unit.objectives),
        semanas: unit.weeks,
      })),
      ...(focus.trim() ? { foco: focus.trim() } : {}),
      contieneDatosEstudiantes: hasStudentData,
      declaraMinimizacion: hasStudentData && minimizationDeclared,
    })
  }

  return (
    <form className="form" onSubmit={submit}>
      <fieldset disabled={disabled}>
        <legend>Datos generales</legend>
        <div className="form-row">
          <Field label="Curso">
            <select required value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">Elige un curso</option>
              {catalog.data.cursos.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Asignatura">
            <select required value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">Elige una asignatura</option>
              {catalog.data.asignaturas.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="form-row">
          <Field label="Periodo">
            <select value={period} onChange={(e) => changePeriod(e.target.value as Period)}>
              {periods.map((item) => (
                <option key={item} value={item}>
                  {PERIOD_LABELS[item]}
                </option>
              ))}
            </select>
          </Field>
          {period === 'semestral' && (
            <Field label="Semestre">
              <select value={semester} onChange={(e) => setSemester(e.target.value === '2' ? 2 : 1)}>
                <option value="1">Primero</option>
                <option value="2">Segundo</option>
              </select>
            </Field>
          )}
          <Field label="Año">
            <input
              type="number"
              required
              min={2020}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </Field>
          <Field label="Modelo de planificación">
            <select value={model} onChange={(e) => setModel(e.target.value as Model)}>
              {models.map((item) => (
                <option key={item} value={item}>
                  {MODEL_LABELS[item]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      {units.map((unit, index) => (
        <fieldset key={unit.key} disabled={disabled}>
          <legend>Unidad {index + 1}</legend>
          <Field label="Nombre">
            <input
              required
              maxLength={300}
              value={unit.name}
              onChange={(e) => updateUnit(unit.key, { name: e.target.value })}
            />
          </Field>
          <div className="form-row">
            <Field label="Objetivos de aprendizaje" hint="Códigos separados por coma, por ejemplo: OA 1, OA 3">
              <input
                required
                value={unit.objectives}
                onChange={(e) => updateUnit(unit.key, { objectives: e.target.value })}
              />
            </Field>
            <Field label="Semanas">
              <input
                type="number"
                required
                min={1}
                max={20}
                value={unit.weeks}
                onChange={(e) => updateUnit(unit.key, { weeks: Number(e.target.value) })}
              />
            </Field>
          </div>
          {units.length > 1 && (
            <div className="actions">
              <Button
                variant="secondary"
                onClick={() => setUnits((list) => list.filter((item) => item.key !== unit.key))}
              >
                Quitar unidad {index + 1}
              </Button>
            </div>
          )}
        </fieldset>
      ))}
      {units.length < maxUnits && (
        <div className="actions">
          <Button variant="secondary" disabled={disabled} onClick={() => setUnits((list) => [...list, newUnit()])}>
            Añadir unidad
          </Button>
        </div>
      )}

      <fieldset disabled={disabled}>
        <legend>Contexto</legend>
        <Field label="Foco de la planificación" hint="Opcional: prioridades, enfoque o necesidades del curso.">
          <textarea maxLength={2000} rows={3} value={focus} onChange={(e) => setFocus(e.target.value)} />
        </Field>
        <label className="checkbox">
          <input type="checkbox" checked={hasStudentData} onChange={(e) => setHasStudentData(e.target.checked)} />
          <span>El contenido incluye datos de estudiantes</span>
        </label>
        {hasStudentData && (
          <label className="checkbox">
            <input
              type="checkbox"
              required
              checked={minimizationDeclared}
              onChange={(e) => setMinimizationDeclared(e.target.checked)}
            />
            <span>Declaro que incluí solo los datos de estudiantes estrictamente necesarios</span>
          </label>
        )}
      </fieldset>

      <div className="actions">
        <Button type="submit" disabled={disabled}>
          Generar
        </Button>
      </div>
    </form>
  )
}
