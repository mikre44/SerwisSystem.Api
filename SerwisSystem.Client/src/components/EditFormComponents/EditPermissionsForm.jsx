import { displayLabels } from "../../displayLabels";
import { useAuth } from "../../context/useAuth";
import { useState } from "react";
import { updatePermissions } from "../../api/api";
import Message from "../Message";

const permissionNames = [
  "ReadRepairs",
  "TakeRepairs",
  "EditRepairs",
  "DeleteRepairs",
  "ReadUsers",
  "EditUsers",
  "DeleteUsers",
  "GrantUsers",
  "DischargeUsers",
];

function EditPermissionsForm({ user, onUpdated }) {
  const { user: loggedUser } = useAuth();
  const [changes, setChanges] = useState({});
  const originalValue = name => Boolean(user.permissions?.[name[0].toLowerCase() + name.slice(1)]);
  const canChange = name => loggedUser.role === "Admin" || Boolean(loggedUser.permissions?.[name[0].toLowerCase() + name.slice(1)]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(permission) {
    setChanges(previous => ({ ...previous, [permission]: !(previous[permission] ?? originalValue(permission)) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const  permissionsGranted = [];
    const  permissionsRevoked = [];

    for (const permission of permissionNames) {
      if (changes[permission] === undefined || changes[permission] === originalValue(permission)) continue;
      if (changes[permission]) {
        permissionsGranted.push(permission);
      } else {
        permissionsRevoked.push(permission);
      }
    }

    try {
      await updatePermissions(
        user.id,
        permissionsGranted,
        permissionsRevoked
      );

      setError("");
      setSuccess("Dane użytkownika zostały zapisane.");

      await onUpdated();
      setChanges({});
    } catch (error) {
      setSuccess("");
      setError(error.message);
    }
  }

  if (loggedUser.id === user.id || (user.role === "Admin" && (loggedUser.role !== "Admin" || loggedUser.priority > user.priority))) return null;

  return (
    <div>
      <h2>Edytuj uprawnienia</h2>

      <Message
        error={error}
        success={success}
      />

      <form onSubmit={handleSubmit}>
        {permissionNames.map((permission) => (
          <div key={permission}>
            <label>
              <input
                type="checkbox"
                checked={changes[permission] ?? originalValue(permission)}
                disabled={!canChange(permission)}
                onChange={() => handleChange(permission)}
              />

              {displayLabels[permission] ?? "Nieznana wartość"}
            </label>
          </div>
        ))}

        <button type="submit">
          Zapisz uprawnienia
        </button>
      </form>
    </div>
  );
}

export default EditPermissionsForm;