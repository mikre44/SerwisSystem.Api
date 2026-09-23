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
      setSuccess("Priority updated successfully.");

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
      {error && <p>Error: {error}</p>}
      {success && <p>{success}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          min={loggedUser.priority + 1}
          value={priority}
          onChange={(event) =>
            setPriority(event.target.value)
          }
        />

        <button type="submit">
          Save priority
        </button>
      </form>
    </div>
  );
}

export default EditAdminPriority;