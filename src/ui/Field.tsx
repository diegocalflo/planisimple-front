import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  hint?: string
  children: ReactNode
}

/** Etiqueta que envuelve un control; así el nombre accesible no depende de ids. */
export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
