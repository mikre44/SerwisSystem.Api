import { useState } from "react";
import { demoteAdmin, promoteAdmin } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import ConfirmButton from "../ConfirmButton";
import Message from "../Message";

// Promotes a worker to admin or demotes an admin. onUpdated() is called after
// a successful change so the parent can load the changed user(s) again.
function EditAdminButton({ user, onUpdated }) {
  const { user: loggedUser } = useAuth();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (loggedUser.role !== "Admin" || loggedUser.id === user.id) {
    return null;
  }

  const isAdmin = user.role === "Admin";
  // A lower priority number means more authority; only a strictly
  // higher authority may demote another admin (the API checks the same).
  const canDemote = loggedUser.priority < user.priority;

  if (isAdmin && !canDemote) {
    return null;
  }

  async function runAction(action, successMessage) {
    try {
      await action(user.id);

      setError("");
      setSuccess(successMessage);
      onUpdated();
    } catch (error) {
      setSuccess("");
      setError(error.message);
    }
  }

  return (
    <div>
      <Message error={error} success={success} />

      {isAdmin ? (
        <ConfirmButton
          message={`Demote ${user.username} to Worker?`}
          onConfirm={() => runAction(demoteAdmin, "Admin demoted successfully.")}
        >
          Demote
        </ConfirmButton>
      ) : (
        <ConfirmButton
          message={`Promote ${user.username} to Admin?`}
          onConfirm={() => runAction(promoteAdmin, "User promoted to Admin.")}
        >
          Promote to Admin
        </ConfirmButton>
      )}
    </div>
  );
}

export default EditAdminButton;
