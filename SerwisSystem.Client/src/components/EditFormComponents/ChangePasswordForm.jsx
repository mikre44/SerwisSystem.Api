import { useState } from "react";
import { changePassword } from "../../api/api";
import Message from "../Message";

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setSuccess("");
      setError("New passwords do not match.");
      return;
    }

    try {
      await changePassword(
        currentPassword,
        newPassword
      );

      setError("");
      setSuccess("Password changed successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setSuccess("");
      setError(error.message);
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
          <label>Current password: </label>

          <input
            type="password"
            required
            value={currentPassword}
            onChange={(event) =>
              setCurrentPassword(event.target.value)
            }
          />
        </div>

        <div>
          <label>New password: </label>

          <input
            type="password"
            required
            minLength="6"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(event.target.value)
            }
          />
        </div>

        <div>
          <label>Confirm new password: </label>

          <input
            type="password"
            required
            minLength="6"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
          />
        </div>

        <button type="submit">
          Change password
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordForm;