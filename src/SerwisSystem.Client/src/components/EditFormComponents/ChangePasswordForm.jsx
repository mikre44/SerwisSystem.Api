import { useState } from "react";
import { changePassword } from "../../api/api";
import FieldError from "../FieldError";
import Message from "../Message";

// Calls PUT /api/users/change-password for the logged-in user.
function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();

    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("");
      setFieldErrors({ confirmPassword: ["Nowe hasła nie są identyczne."] });
      return;
    }

    setBusy(true);

    try {
      await changePassword(currentPassword, newPassword);

      setError("");
      setFieldErrors({});
      setSuccess("Hasło zostało zmienione.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(error.message);
      setFieldErrors(error.fieldErrors ?? {});
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Message error={error} success={success} />

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="current-password" className="form-label">
            Obecne hasło
          </label>
          <input
            id="current-password"
            type="password"
            className={`form-control ${fieldErrors.currentPassword ? "is-invalid" : ""}`}
            autoComplete="current-password"
            required
            disabled={busy}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <FieldError messages={fieldErrors.currentPassword} />
        </div>

        <div className="mb-3">
          <label htmlFor="new-password" className="form-label">
            Nowe hasło
          </label>
          <input
            id="new-password"
            type="password"
            className={`form-control ${fieldErrors.newPassword ? "is-invalid" : ""}`}
            autoComplete="new-password"
            required
            minLength="6"
            disabled={busy}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <FieldError messages={fieldErrors.newPassword} />
        </div>

        <div className="mb-3">
          <label htmlFor="confirm-password" className="form-label">
            Potwierdź nowe hasło
          </label>
          <input
            id="confirm-password"
            type="password"
            className={`form-control ${fieldErrors.confirmPassword ? "is-invalid" : ""}`}
            autoComplete="new-password"
            required
            minLength="6"
            disabled={busy}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <FieldError messages={fieldErrors.confirmPassword} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy && (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          )}
          Zmień hasło
        </button>
      </form>
    </>
  );
}

export default ChangePasswordForm;
