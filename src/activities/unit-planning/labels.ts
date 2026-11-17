import type { ActivityParams } from '@/activities/_shared/definition'

type PlanningModel = ActivityParams['modeloPlanificacion']
type Period = ActivityParams['periodo']

export const MODEL_LABELS: Record<PlanningModel, string> = {
  diseno_inverso: 'Diseño Inverso',
  sabana: 'Sábana',
  modelo_t: 'Modelo T',
  abp: 'Aprendizaje Basado en Proyectos',
}

export const PERIOD_LABELS: Record<Period, string> = {
  semestral: 'Semestral',
  anual: 'Anual',
}

/** Máximo de unidades por periodo, según la guía de integración del backend. */
export const MAX_UNITS: Record<Period, number> = {
  semestral: 4,
  anual: 8,
}

export const PHASE_LABELS: Record<string, string> = {
  presentacion_reto: 'Presentación del reto',
  investigacion_planificacion: 'Investigación y planificación',
  desarrollo_produccion: 'Desarrollo y producción',
  presentacion_producto: 'Presentación del producto',
  evaluacion_reflexion: 'Evaluación y reflexión',
}
