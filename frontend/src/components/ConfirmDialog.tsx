import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Modal } from './ui/Modal';

interface Props {
  title: string;
  message: ReactNode;
  detail?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación con el estilo de la app (reemplaza al window.confirm del navegador). */
export function ConfirmDialog({ title, message, detail, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    <Modal title={title} icon={<AlertTriangle size={14} />} iconClassName="bg-red-100 text-red-600" size="sm" role="alertdialog" onClose={onCancel}>
      <div className="px-5 py-5">
        <p className="text-sm text-foreground">{message}</p>
        {detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}
        <div className="mt-5 flex items-center justify-end gap-2">
          {/* El foco inicial va a "Cancelar": un Enter accidental no ejecuta la acción */}
          <button autoFocus onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button onClick={onConfirm} className="btn-danger">{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
