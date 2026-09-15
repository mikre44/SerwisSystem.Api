import { useState } from "react";
import { updateUser } from "../../api/api";

function EditUserForm({ user, onUpdated }) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);

  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await updateUser(user.id, username, email);

      setError("");

      await onUpdated();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div>
      <h2>Edit user</h2>

      {error && <p>Error: {error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Username: </label>

          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div>
          <label>Email: </label>

          <input
            type="email"
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

export default EditUserForm;