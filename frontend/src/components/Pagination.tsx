import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onChange: (p: number) => void;
  onLimitChange: (limit: number) => void;
}

const PAGE_SIZES = [10, 20, 50];

/** Calcula hasta 5 números de página alrededor de la actual. */
function visiblePages(page: number, totalPages: number): number[] {
  const count = Math.min(totalPages, 5);
  const start = Math.min(Math.max(1, page - 2), totalPages - count + 1);
  return Array.from({ length: count }, (_, i) => start + i);
}

export function Pagination({ page, totalPages, total, limit, onChange, onLimitChange }: Props) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav aria-label="Paginación"
      className="flex flex-col items-center justify-between gap-3 rounded-b-xl border-t border-border bg-muted/20 px-5 py-3.5 sm:flex-row">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Mostrando {from}–{to} de {total}</span>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Por página:
          <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Página anterior"
          className="rounded-lg border border-border p-1.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronLeft size={14} />
        </button>
        {visiblePages(page, totalPages).map((n) => (
          <button key={n} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}
            className={`h-7 w-7 rounded-lg border text-xs transition-colors ${
              n === page ? 'border-primary bg-primary font-semibold text-white' : 'border-border text-foreground hover:bg-muted'}`}>
            {n}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Página siguiente"
          className="rounded-lg border border-border p-1.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronRight size={14} />
        </button>
      </div>
    </nav>
  );
}
