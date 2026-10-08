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
      setSuccess("Dane użytkownika zostały zapisane.");

      await onUpdated();
    } catch (error) {
      setError(error.message);
      setSuccess("");

    }
  }

  return (
    <div>
      <h2>Edytuj użytkownika</h2>

      <Message
        error={error}
        success={success}
      />

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="edituserform-1">Nazwa użytkownika: </label>

          <input id="edituserform-1"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="edituserform-2">E-mail: </label>

          <input id="edituserform-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <button type="submit">
          Zapisz
        </button>
      </form>
    </div>
  );
}

export default EditUserForm;