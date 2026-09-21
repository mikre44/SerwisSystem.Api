function ConfirmButton({
  message,
  onConfirm,
  children,
  disabled = false,
}) {
  async function handleClick() {
    const confirmed = window.confirm(message);

    if (!confirmed) {
      return;
    }

    await onConfirm();
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default ConfirmButton;