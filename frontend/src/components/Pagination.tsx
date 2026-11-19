interface Props { page: number; totalPages: number; total: number; onChange: (p: number) => void }

export function Pagination({ page, totalPages, total, onChange }: Props) {
  return (
    <nav className="pagination" aria-label="Paginación">
      <span>{total} productos</span>
      <div>
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}>Anterior</button>
        <span className="page">Página {page} de {totalPages}</span>
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}>Siguiente</button>
      </div>
    </nav>
  );
}
