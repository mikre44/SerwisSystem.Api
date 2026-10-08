import { useRef } from "react";

function ConfirmButton({
  message,
  onConfirm,
  children,
  disabled = false,
}) {
  const dialog = useRef(null);
  const resolveConfirmation = useRef(null);

  async function handleClick() {
    const confirmed = await new Promise(resolve => {
      resolveConfirmation.current = resolve;
      dialog.current.showModal();
    });

    if (!confirmed) {
      return;
    }

    await onConfirm();
  }

  return (
    <>
      <button onClick={handleClick} disabled={disabled}>
        {children}
      </button>
      <dialog ref={dialog} aria-label="Potwierdzenie czynności"
        onClose={() => {
          resolveConfirmation.current?.(dialog.current.returnValue === "confirm");
          resolveConfirmation.current = null;
          dialog.current.returnValue = "";
        }}>
        <p>{message}</p>
        <form method="dialog">
          <button value="cancel" autoFocus>Anuluj</button>
          <button value="confirm">Potwierdź</button>
        </form>
      </dialog>
    </>
  );
}

export default ConfirmButton;
