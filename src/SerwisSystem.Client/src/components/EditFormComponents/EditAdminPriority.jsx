import { useState } from "react";
import { updateAdminPriority } from "../../api/api";
import { canManageUser } from "../../permissions";
import Message from "../Message";

function EditAdminPriority({ admin, loggedUser, onUpdated }) {
  const [priority, setPriority] = useState(admin.priority);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Only a strictly higher authority may change it, and never your own.
  const canManage =
    loggedUser.id !== admin.id &&
    canManageUser(loggedUser, admin);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);

    try {
      await updateAdminPriority(admin.id, Number(priority));

      setError("");
      setSuccess("Priorytet został zaktualizowany.");
      onUpdated();
    } catch (error) {
      setSuccess("");
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!canManage) {
    return <span className="badge text-bg-secondary">{admin.priority}</span>;
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="input-group input-group-sm"
        style={{ maxWidth: "9rem" }}
      >
        <input
          type="number"
          className="form-control"
          aria-label={`Priorytet użytkownika ${admin.username}`}
          min={loggedUser.priority + 1}
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          disabled={busy}
        />

        <button
          type="submit"
          className="btn btn-outline-primary"
          disabled={busy}
          title="Zapisz priorytet"
        >
          {busy ? (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          ) : (
            <i className="bi bi-check-lg" aria-hidden="true" />
          )}
          <span className="visually-hidden">Zapisz priorytet</span>
        </button>
      </form>

      <Message error={error} success={success} />
    </div>
  );
}

export default EditAdminPriority;
