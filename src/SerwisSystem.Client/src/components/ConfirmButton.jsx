function ConfirmButton({
  message,
  onConfirm,
  children,
  disabled = false,
  className = "btn btn-outline-danger",
  type = "button",
  ...rest
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
      type={type}
      className={className}
      onClick={handleClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export default ConfirmButton;
