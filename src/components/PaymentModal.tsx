import { useEffect, useId, useRef } from 'react';
import { money } from '../lib/domain';

// Modal de pago exclusivamente visual. Cambia su diseño en .payment-modal de styles.css.
// No lee ni serializa los campos: no usa FormData, estado de React, almacenamiento ni solicitudes.
// Usa únicamente datos ficticios; el formulario se vacía al cerrar o completar la vista previa.
export function PaymentModal({ amount, onClose, onComplete }: { amount: number; onClose: () => void; onComplete: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    return () => {
      element.querySelector('form')?.reset();
      if (element.open) element.close();
    };
  }, []);

  function close() {
    dialog.current?.querySelector('form')?.reset();
    dialog.current?.close();
    onClose();
  }

  return <dialog ref={dialog} className="payment-modal" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); close(); }}>
    <div className="payment-modal-heading">
      <div><span className="eyebrow">VISTA PREVIA · SIN COBRO</span><h2 id={titleId}>Datos de pago</h2></div>
      <button className="payment-modal-close" type="button" aria-label="Cerrar datos de pago" onClick={close}>×</button>
    </div>
    <p id={descriptionId} className="payment-modal-description">Usa datos ficticios. Esta demostración no realiza cobros ni guarda o envía los campos.</p>
    <div className="payment-modal-summary"><span>Importe de la reserva</span><strong>{money(amount)}</strong></div>
    {/* method="dialog" impide el envío HTTP incluso si cambia el manejo del formulario. */}
    <form method="dialog" autoComplete="off" onSubmit={event => {
      event.preventDefault();
      event.currentTarget.reset();
      onComplete();
    }}>
      {/* Campos sin name ni onChange: el contenido permanece solo en los controles del navegador. */}
      <label>Nombre de ejemplo<input type="text" autoComplete="off" placeholder="Viajero de ejemplo" maxLength={80} required /></label>
      <label>Número de tarjeta de ejemplo<input type="text" inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" maxLength={19} pattern="[0-9 ]{12,19}" aria-describedby={descriptionId} required /></label>
      <div className="payment-modal-fields">
        <label>Vencimiento de ejemplo<input type="text" inputMode="numeric" autoComplete="off" placeholder="MM/AA" maxLength={5} pattern="(0[1-9]|1[0-2])/[0-9]{2}" required /></label>
        <label>Código de ejemplo<input type="text" inputMode="numeric" autoComplete="off" placeholder="123" maxLength={4} pattern="[0-9]{3,4}" required /></label>
      </div>
      <div className="payment-modal-actions">
        <button className="button full-width" type="submit">Confirmar pago demo</button>
        <button className="text-button" type="button" onClick={close}>Volver a mi reserva</button>
      </div>
    </form>
  </dialog>;
}
