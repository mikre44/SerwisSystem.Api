import { useState } from "react";
import { demoteAdmin, promoteAdmin } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { canManageUser } from "../../permissions";
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

  // Only a strictly higher authority may demote another admin (the API checks the same).
  if (isAdmin && !canManageUser(loggedUser, user)) {
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
          message={`Odebrać uprawnienia administratora użytkownikowi ${user.username}?`}
          onConfirm={() => runAction(demoteAdmin, "Administrator został zdegradowany do pracownika.")}
          className="btn btn-outline-danger btn-sm"
        >
          <i className="bi bi-shield-minus me-1" aria-hidden="true" />
          Degraduj
        </ConfirmButton>
      ) : (
        <ConfirmButton
          message={`Nadać uprawnienia administratora użytkownikowi ${user.username}?`}
          onConfirm={() => runAction(promoteAdmin, "Użytkownikowi nadano uprawnienia administratora.")}
          className="btn btn-outline-primary btn-sm"
        >
          <i className="bi bi-shield-plus me-1" aria-hidden="true" />
          Awansuj na admina
        </ConfirmButton>
      )}
    </div>
  );
}

export default EditAdminButton;
