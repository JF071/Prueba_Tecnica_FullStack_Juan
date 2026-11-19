import { Sprout } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
        <Sprout size={18} />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-tight text-foreground">AgroMarket Admin</p>
        <p className="text-[11px] text-muted-foreground">Catálogo de productos</p>
      </div>
    </div>
  );
}
