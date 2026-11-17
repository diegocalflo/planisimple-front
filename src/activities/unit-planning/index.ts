import type { ActivityDefinition } from '@/activities/_shared/definition'
import { exportDocx } from './exporter'
import { Form } from './Form'
import { PERIOD_LABELS } from './labels'
import { Viewer } from './Viewer'

/** Única entrada pública de la actividad; solo la importa `activities/registry`. */
const unitPlanning: ActivityDefinition = {
  Form,
  Viewer,
  exportDocx,
  documentTitle: (params) =>
    `Planificación ${PERIOD_LABELS[params.periodo].toLowerCase()} · ${params.asignatura} · ${params.curso}`,
}

export default unitPlanning
