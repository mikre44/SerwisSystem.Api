import { useState } from "react";
import { updateAdminPriority } from "../../api/api";

function EditAdminPriority({ admin, loggedUser, onUpdated }) {
  const [priority, setPriority] = useState(admin.priority);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canManage =
    loggedUser.id !== admin.id &&
    loggedUser.priority <= admin.priority;

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await updateAdminPriority(
        admin.id,
        Number(priority)
      );

      setError("");
      setSuccess("Priorytet został zmieniony.");

      await onUpdated();
    } catch (error) {
      setSuccess("");
      setError(error.message);
    }
  }

  if (!canManage) {
    return <span>{admin.priority}</span>;
  }

  return (
    <div>
      {error && <p>Błąd: {error}</p>}
      {success && <p>{success}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          min={loggedUser.priority}
          max={999}
          value={priority}
          onChange={(event) =>
            setPriority(event.target.value)
          }
        />

        <button type="submit">
          Zapisz priorytet
        </button>
      </form>
    </div>
  );
}

export default EditAdminPriority;