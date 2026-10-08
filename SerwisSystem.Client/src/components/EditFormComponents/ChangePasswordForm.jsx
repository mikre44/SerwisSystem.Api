import { useState } from "react";
import { changePassword } from "../../api/api";
import { useAuth } from "../../context/useAuth";
import Message from "../Message";

function ChangePasswordForm() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setSuccess("");
      setError("Nowe hasła nie są takie same.");
      return;
    }

    try {
      await changePassword(
        currentPassword,
        newPassword
      );

      logout();
      setError("");
      setSuccess("Hasło zostało zmienione.");

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
      <h2>Zmień hasło</h2>

      <Message
        error={error}
        success={success}
      />

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="changepasswordform-1">Obecne hasło: </label>

          <input id="changepasswordform-1"
            type="password"
            required
            value={currentPassword}
            onChange={(event) =>
              setCurrentPassword(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="changepasswordform-2">Nowe hasło: </label>

          <input id="changepasswordform-2"
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
          <label htmlFor="changepasswordform-3">Powtórz nowe hasło: </label>

          <input id="changepasswordform-3"
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
          Zmień hasło
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordForm;