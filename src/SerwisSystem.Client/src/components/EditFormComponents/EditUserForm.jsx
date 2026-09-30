import { useState } from "react";
import { updateUser } from "../../api/api";
import FieldError from "../FieldError";
import Message from "../Message";

// Edits username and email. Headless (no card of its own) — the page that
// uses it provides the surrounding card and title.
function EditUserForm({ user, onUpdated }) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await updateUser(user.id, username, email);

      setError("");
      setFieldErrors({});
      setSuccess("Dane użytkownika zostały zaktualizowane.");

      await onUpdated();
    } catch (error) {
      setSuccess("");
      setError(error.message);
      setFieldErrors(error.fieldErrors ?? {});
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Message error={error} success={success} />

      <div className="row g-3">
        <div className="col-md-6">
          <label htmlFor="edit-user-username" className="form-label">
            Nazwa użytkownika
          </label>
          <input
            id="edit-user-username"
            type="text"
            className={`form-control ${fieldErrors.username?.length ? "is-invalid" : ""}`}
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <FieldError messages={fieldErrors.username} />
        </div>

        <div className="col-md-6">
          <label htmlFor="edit-user-email" className="form-label">
            E-mail
          </label>
          <input
            id="edit-user-email"
            type="email"
            className={`form-control ${fieldErrors.email?.length ? "is-invalid" : ""}`}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FieldError messages={fieldErrors.email} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary mt-3">
        <i className="bi bi-check-lg me-2" aria-hidden="true" />
        Zapisz zmiany
      </button>
    </form>
  );
}

export default EditUserForm;
