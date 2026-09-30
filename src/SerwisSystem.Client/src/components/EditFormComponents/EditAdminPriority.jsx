import { useState } from "react";
import { updateAdminPriority } from "../../api/api";
import Message from "../Message";

function EditAdminPriority({ admin, loggedUser, onUpdated }) {
  const [priority, setPriority] = useState(admin.priority);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // A lower number means more authority; only a strictly higher authority may change it.
  const canManage =
    loggedUser.id !== admin.id &&
    loggedUser.priority < admin.priority;

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await updateAdminPriority(admin.id, Number(priority));

      setError("");
      setSuccess("Priority updated successfully.");
      onUpdated();
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
      <Message error={error} success={success} />

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          aria-label={`Priority of ${admin.username}`}
          min={loggedUser.priority + 1}
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        />

        <button type="submit">
          Save priority
        </button>
      </form>
    </div>
  );
}

export default EditAdminPriority;
