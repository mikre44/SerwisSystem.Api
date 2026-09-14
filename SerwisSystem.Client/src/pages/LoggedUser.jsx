import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateUser } from "../api/api";

function LoggedUser() {
  const { user, reloadUser } = useAuth();

  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await updateUser(user.id, username, email);

      await reloadUser();

      alert("User updated!");
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div>
      <h1>My profile</h1>

      <p>ID: {user.id}</p>
      <p>Role: {user.role}</p>
      <p>Priority: {user.priority}</p>

      <h2>Edit user</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>

          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div>
          <label>Email:</label>

          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <button type="submit">
          Save
        </button>
      </form>
    </div>
  );
}

export default LoggedUser;