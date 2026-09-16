import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

function DeleteUserButton({ user }) {
  const { user: loggedUser } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState("");

  const canDelete =
    loggedUser.id !== user.id &&
    (loggedUser.role === "Admin" ||
      loggedUser.permissions?.deleteUsers);

  async function handleDelete() {
    try {
      await deleteUser(user.id);

      navigate("/users");
    } catch (error) {
      setError(error.message);
    }
  }

  if (!canDelete) {
    return null;
  }

  return (
    <div>
      {error && <p>Error: {error}</p>}

      <button onClick={handleDelete}>
        Delete user
      </button>
    </div>
  );
}

export default DeleteUserButton;