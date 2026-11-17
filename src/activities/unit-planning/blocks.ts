import type { ActivityResult } from '@/activities/_shared/definition'
import type { DocumentBlock } from '@/documents/model'
import { MODEL_LABELS, PERIOD_LABELS, PHASE_LABELS } from './labels'

// Un solo mapeo del resultado a bloques: lo usan el Viewer y el exporter, así
// la pantalla y el Word muestran lo mismo.

type Result<Model extends ActivityResult['modeloPlanificacion']> = Extract<ActivityResult, { modeloPlanificacion: Model }>

interface Adaptations {
  acceso: string[]
  noSignificativas: string[]
  significativas: string[]
}

const heading = (text: string, level: 1 | 2 | 3 = 1): DocumentBlock => ({ kind: 'heading', text, level })
const paragraph = (text: string): DocumentBlock => ({ kind: 'paragraph', text })
const joined = (items: readonly string[]) => items.join(', ')

/** Título y lista, o nada si la lista está vacía. */
function section(title: string, items: readonly string[], level: 1 | 2 | 3 = 2): DocumentBlock[] {
  return items.length > 0 ? [heading(title, level), { kind: 'list', items: [...items] }] : []
}

function table(headers: string[], rows: string[][]): DocumentBlock[] {
  return rows.length > 0 ? [{ kind: 'table', headers, rows }] : []
}

function adaptations(value: Adaptations, level: 1 | 2 | 3 = 2): DocumentBlock[] {
  const nested = (level === 1 ? 2 : 3) as 2 | 3
  const content = [
    ...section('De acceso', value.acceso, nested),
    ...section('No significativas', value.noSignificativas, nested),
    ...section('Significativas', value.significativas, nested),
  ]
  return content.length > 0 ? [heading('Adecuaciones', level), ...content] : []
}

function reverseDesign(result: Result<'diseno_inverso'>): DocumentBlock[] {
  return result.unidades.flatMap((unit) => [
    heading(`Unidad ${unit.numero}: ${unit.nombre}`),
    paragraph(`Semestre ${unit.semestre}. ${unit.proposito}`),
    paragraph(`Objetivos de aprendizaje: ${joined(unit.objetivosAprendizaje)}`),
    ...section('Objetivos actitudinales', unit.objetivosActitudinales),
    ...section('Evidencias de aprendizaje', unit.evidenciasAprendizaje),
    heading('Semanas', 2),
    ...table(
      ['Semana', 'Foco', 'OA', 'Contenidos', 'Experiencias', 'Diversificación'],
      unit.semanas.map((week) => [
        String(week.semana),
        week.foco,
        joined(week.objetivosAprendizaje),
        joined(week.contenidos),
        joined(week.experiencias),
        joined(week.diversificacion),
      ]),
    ),
    ...(unit.evaluaciones.length > 0 ? [heading('Evaluaciones', 2)] : []),
    ...table(
      ['Tipo', 'Nombre', 'Semana', 'Instrumento', 'Ponderación'],
      unit.evaluaciones.map((evaluation) => [
        evaluation.tipo === 'sumativa' ? 'Sumativa' : 'Formativa',
        evaluation.nombre,
        String(evaluation.semana),
        evaluation.instrumento,
        evaluation.ponderacion ?? '',
      ]),
    ),
    ...adaptations(unit.adecuaciones),
  ])
}

function sheet(result: Result<'sabana'>): DocumentBlock[] {
  return [
    heading('Planificación'),
    ...table(
      ['Semestre', 'Mes', 'Semana', 'Unidad', 'OA', 'Contenido', 'Actividad', 'Instrumento', 'Fecha', 'Ponderación'],
      result.filas.map((row) => [
        String(row.semestre),
        row.mes,
        String(row.semana),
        String(row.unidad),
        joined(row.objetivosAprendizaje),
        row.contenido,
        row.actividad,
        row.instrumento ?? '',
        row.fechaEvaluacion ?? '',
        row.ponderacion ?? '',
      ]),
    ),
    ...section('Estrategias formativas', result.estrategiasFormativas, 1),
    ...adaptations(result.resumenAdecuaciones, 1),
  ]
}

function tModel(result: Result<'modelo_t'>): DocumentBlock[] {
  return result.unidades.flatMap((unit) => [
    heading(`Unidad ${unit.numero}: ${unit.nombre}`),
    paragraph(`Semestre ${unit.semestre}.`),
    heading('Capacidades y destrezas', 2),
    ...table(
      ['Capacidad', 'Destrezas', 'OA'],
      unit.capacidades.map((item) => [item.capacidad, joined(item.destrezas), item.objetivoAprendizaje]),
    ),
    heading('Valores y actitudes', 2),
    ...table(
      ['Valor', 'Actitudes', 'OAT'],
      unit.valores.map((item) => [item.valor, joined(item.actitudes), item.objetivoActitudinal]),
    ),
    ...section('Contenidos', unit.contenidos),
    ...(unit.metodosProcedimientos.length > 0 ? [heading('Métodos y procedimientos', 2)] : []),
    ...table(
      ['Nombre', 'Capacidad', 'Destreza', 'Contenido'],
      unit.metodosProcedimientos.map((item) => [item.nombre, item.capacidad, item.destreza, item.contenido]),
    ),
    ...(unit.evaluacion.length > 0 ? [heading('Evaluación', 2)] : []),
    ...table(
      ['Destreza o actitud', 'Instrumento', 'Indicador de logro'],
      unit.evaluacion.map((item) => [item.destrezaOActitud, item.instrumento, item.indicadorLogro]),
    ),
    ...adaptations(unit.adecuaciones),
  ])
}

function projects(result: Result<'abp'>): DocumentBlock[] {
  return result.proyectos.flatMap((project) => [
    heading(`Proyecto ${project.numero}: ${project.nombre}`),
    paragraph(`Semestre ${project.semestre}.`),
    paragraph(`Desafío impulsor: ${project.desafioImpulsor}`),
    paragraph(`Producto público: ${project.productoPublico}`),
    heading('Fases', 2),
    ...table(
      ['Fase', 'Semanas', 'Descripción', 'OA', 'Evidencias'],
      project.fases.map((phase) => [
        PHASE_LABELS[phase.fase] ?? phase.fase,
        joined(phase.semanas.map(String)),
        phase.descripcion,
        joined(phase.objetivosAprendizaje),
        joined(phase.evidencias),
      ]),
    ),
    heading('Evaluación', 2),
    paragraph(project.evaluacion),
    ...(project.comunicacionFamilias ? [heading('Comunicación con las familias', 2), paragraph(project.comunicacionFamilias)] : []),
    ...section('Metacognición', project.metacognicion),
    ...adaptations(project.adecuaciones),
  ])
}

export function toBlocks(result: ActivityResult): DocumentBlock[] {
  const blocks: DocumentBlock[] = [
    paragraph(`${MODEL_LABELS[result.modeloPlanificacion]} · ${PERIOD_LABELS[result.periodo]}`),
    ...section('Advertencias', result.advertencias, 1),
  ]
  switch (result.modeloPlanificacion) {
    case 'diseno_inverso':
      return [...blocks, ...reverseDesign(result)]
    case 'sabana':
      return [...blocks, ...sheet(result)]
    case 'modelo_t':
      return [...blocks, ...tModel(result)]
    case 'abp':
      return [...blocks, ...projects(result)]
  }
}
