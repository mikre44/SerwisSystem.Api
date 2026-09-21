import { useState } from "react";
import { updateUser } from "../../api/api";
import Message from "../Message";

function EditUserForm({ user, onUpdated }) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await updateUser(user.id, username, email);

      setError("");
      setSuccess("User updated successfully.");

      await onUpdated();
    } catch (error) {
      setError(error.message);
      setSuccess("");

    }
  }

  return (
    <div>
      <h2>Edit user</h2>

      <Message
        error={error}
        success={success}
      />

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