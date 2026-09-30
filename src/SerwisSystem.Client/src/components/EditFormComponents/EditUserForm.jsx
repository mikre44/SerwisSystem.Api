import { useState } from "react";
import { updateUser } from "../../api/api";
import FieldError from "../FieldError";
import Message from "../Message";

function EditUserForm({ user, onUpdated }) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await updateUser(user.id, username, email);

      setError("");
      setFieldErrors({});
      setSuccess("User updated successfully.");

      await onUpdated();
    } catch (error) {
      setSuccess("");
      setError(error.message);
      setFieldErrors(error.fieldErrors ?? {});
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
          <label htmlFor="edit-user-username">Username</label>
          <input
            id="edit-user-username"
            type="text"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <FieldError messages={fieldErrors.username} />
        </div>

        <div>
          <label htmlFor="edit-user-email">Email</label>
          <input
            id="edit-user-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FieldError messages={fieldErrors.email} />
        </div>

        <button type="submit">
          Save
        </button>
      </form>
    </div>
  );
}

export default EditUserForm;
