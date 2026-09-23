import { useState } from "react";
import { promoteAdmin } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
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
      setSuccess("User promoted to Admin.");

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
      setSuccess("Admin demoted successfully.");

      await loadAdmins();
    } catch (error) {
      setSuccess("");
      setError(error.message);
    }
  }
  
  if (user.role !== "Admin")
  return (
    <div>
      {error && <p>Error: {error}</p>}
      {success && <p>{success}</p>}

      <ConfirmButton
        message={`Promote ${user.username} to Admin?`}
        onConfirm={handlePromote}
      >
        Promote to Admin
      </ConfirmButton>
    </div>
  );
  else if(canManage)
    return(
      <ConfirmButton
        message={`Demote ${user.username} to Worker?`}
        onConfirm={handleDemote}
      >
        Demote
      </ConfirmButton> 
    );
  return null;
}

export default EditAdminButton;