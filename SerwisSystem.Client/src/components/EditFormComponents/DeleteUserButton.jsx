import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
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

      setSuccess("User deleted successfully.");
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
        message={`Are you sure you want to delete ${user.username}?`}
        onConfirm={handleDelete}
      >
        Delete user
      </ConfirmButton>
    </div>
  );
}

export default DeleteUserButton;