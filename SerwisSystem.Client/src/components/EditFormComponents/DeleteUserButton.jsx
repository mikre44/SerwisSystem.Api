import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser } from "../../api/api";
import { useAuth } from "../../context/useAuth";
import ConfirmButton from "../ConfirmButton";
import Message from "../Message";

function DeleteUserButton({ user }) {
  const { user: loggedUser } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canDelete =
    loggedUser.id !== user.id &&
    (loggedUser.role === "Admin" ||
      loggedUser.permissions?.deleteUsers);

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
    <div>
      <Message
        error={error}
        success={success}
      />

      <ConfirmButton
        message={`Czy na pewno chcesz usunąć użytkownika ${user.username}?`}
        onConfirm={handleDelete}
      >
        Usuń użytkownika
      </ConfirmButton>
    </div>
  );
}

export default DeleteUserButton;