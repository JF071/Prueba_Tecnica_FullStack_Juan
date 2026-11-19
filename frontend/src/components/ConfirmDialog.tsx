import { useEscape } from '../hooks/useEscape';

interface Props { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }

/** Confirmación con el estilo de la app (reemplaza al window.confirm del navegador). */
export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: Props) {
  useEscape(onCancel);

  return (
    <div className="overlay" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={onCancel}>
      {/* stopPropagation: un clic dentro de la tarjeta no debe cerrarla */}
      <div className="card modal confirm" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="actions">
          {/* El foco inicial va a "Cancelar": un Enter accidental no borra nada */}
          <button autoFocus onClick={onCancel}>Cancelar</button>
          <button className="danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
