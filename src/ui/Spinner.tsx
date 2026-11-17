export function Spinner({ label = 'Cargando' }: { label?: string }) {
  return (
    <p className="spinner" role="status">
      <span className="spinner-dot" aria-hidden="true" />
      {label}…
    </p>
  )
}
