import { useState } from "react";
import { changePassword } from "../../api/api";
import FieldError from "../FieldError";
import Message from "../Message";

// Calls PUT /api/users/change-password for the logged-in user.
function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();

    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("");
      setFieldErrors({ confirmPassword: ["New passwords do not match."] });
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);

      setError("");
      setFieldErrors({});
      setSuccess("Password changed successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(error.message);
      setFieldErrors(error.fieldErrors ?? {});
    }
  }

  return (
    <div>
      <h2>Change password</h2>

      <Message
        error={error}
        success={success}
      />

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <FieldError messages={fieldErrors.currentPassword} />
        </div>

        <div>
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength="6"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <FieldError messages={fieldErrors.newPassword} />
        </div>

        <div>
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength="6"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <FieldError messages={fieldErrors.confirmPassword} />
        </div>

        <button type="submit">
          Change password
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordForm;
