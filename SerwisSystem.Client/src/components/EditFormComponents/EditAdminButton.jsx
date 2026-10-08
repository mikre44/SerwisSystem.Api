import { useState } from "react";
import { promoteAdmin, demoteAdmin } from "../../api/api";
import { useAuth } from "../../context/useAuth";
import ConfirmButton from "../ConfirmButton";

function EditAdminButton({ user, onUpdated }) {
  const { user: loggedUser } = useAuth();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canManage =
  loggedUser.id !== user.id &&
  loggedUser.priority <= user.priority;

  if (
    loggedUser.role !== "Admin" ||
    loggedUser.id === user.id
  ) {
    return null;
  }

  async function handlePromote() {
    try {
      await promoteAdmin(user.id);

      setError("");
      setSuccess("Nadano uprawnienia administratora.");

      await onUpdated();
    } catch (error) {
      setSuccess("");
      setError(error.message);
    }
  }

    async function handleDemote() {
    try {
      await demoteAdmin(user.id);

      setError("");
      setSuccess("Odebrano uprawnienia administratora.");

      await onUpdated();
    } catch (error) {
      setSuccess("");
      setError(error.message);
    }
  }

  if (user.role !== "Admin")
  return (
    <div>
      {error && <p>Błąd: {error}</p>}
      {success && <p>{success}</p>}

      <ConfirmButton
        message={`Czy nadać użytkownikowi ${user.username} uprawnienia administratora?`}
        onConfirm={handlePromote}
      >
        Nadaj uprawnienia administratora
      </ConfirmButton>
    </div>
  );
  else if(canManage)
    return(
      <div>
      {error && <p role="alert">{error}</p>}
      {success && <p>{success}</p>}
      <ConfirmButton
        message={`Czy odebrać użytkownikowi ${user.username} uprawnienia administratora?`}
        onConfirm={handleDemote}
      >
        Odbierz uprawnienia administratora
      </ConfirmButton>
      </div>
    );
  return null;
}

export default EditAdminButton;