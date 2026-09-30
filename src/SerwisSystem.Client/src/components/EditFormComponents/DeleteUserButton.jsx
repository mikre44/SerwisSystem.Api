import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { canManageUser, hasPermission } from "../../permissions";
import ConfirmButton from "../ConfirmButton";
import Message from "../Message";

// Renders its own danger-zone card (including the header), and nothing at
// all when the logged-in user has no permission to delete this user.
function DeleteUserButton({ user }) {
  const { user: loggedUser } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Same checks as DELETE /users/{id}: never yourself, DeleteUsers,
  // and an admin only with a higher authority.
  const canDelete =
    loggedUser.id !== user.id &&
    hasPermission(loggedUser, "deleteUsers") &&
    canManageUser(loggedUser, user);

  async function handleDelete() {
    try {
      await deleteUser(user.id);

      setSuccess("Użytkownik został usunięty.");
      navigate("/users");
    } catch (error) {
      setSuccess("");
      setError(error.message);
    }
  }

  if (!canDelete) {
    return null;
  }

  return (
    <div className="card border-danger shadow-sm">
      <div className="card-header text-danger">Strefa zagrożenia</div>

      <div className="card-body">
        <Message error={error} success={success} />

        <p className="text-body-secondary">Usunięcie użytkownika jest nieodwracalne.</p>

        <ConfirmButton
          className="btn btn-outline-danger"
          message={`Czy na pewno chcesz usunąć użytkownika ${user.username}?`}
          onConfirm={handleDelete}
        >
          <i className="bi bi-trash me-2" aria-hidden="true" />
          Usuń użytkownika
        </ConfirmButton>
      </div>
    </div>
  );
}

export default DeleteUserButton;
