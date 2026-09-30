import { useState } from "react";
import { updatePermissions } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import {
  PERMISSION_GROUPS,
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  hasPermission,
} from "../../permissions";
import Message from "../Message";

// The API sends permissions in camelCase ("readRepairs"), but the grant
// endpoint expects the enum names ("ReadRepairs").
function toApiName(key) {
  return key[0].toUpperCase() + key.slice(1);
}

function readPermissions(user) {
  return Object.fromEntries(
    PERMISSION_KEYS.map((key) => [key, user.permissions?.[key] ?? false])
  );
}

// Edits a user's permission flags. Headless (no card of its own) — the page
// that uses it provides the surrounding card and title.
function EditPermissionsForm({ user, onUpdated }) {
  const { user: loggedUser } = useAuth();
  const [permissions, setPermissions] = useState(() => readPermissions(user));

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState("");

  function handleChange(key) {
    setPermissions({
      ...permissions,
      [key]: !permissions[key],
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setInfo("");

    // Send only the switches that differ from what the user has now. The API
    // lets you grant or revoke only permissions you hold yourself, so sending
    // all of them would fail for anyone who is not an admin.
    const current = readPermissions(user);
    const changedKeys = PERMISSION_KEYS.filter((key) => permissions[key] !== current[key]);

    if (changedKeys.length === 0) {
      setInfo("Nie zmieniono żadnych uprawnień.");
      return;
    }

    const permissionsGranted = changedKeys.filter((key) => permissions[key]).map(toApiName);
    const permissionsRevoked = changedKeys.filter((key) => !permissions[key]).map(toApiName);

    try {
      await updatePermissions(user.id, permissionsGranted, permissionsRevoked);

      setSuccess("Uprawnienia zostały zaktualizowane.");

      await onUpdated();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Message error={error} success={success} info={info} />

      <div className="row g-4">
        {PERMISSION_GROUPS.map((group) => (
          <div className="col-sm-6" key={group.title}>
            <h3 className="h6 text-body-secondary text-uppercase mb-3">{group.title}</h3>

            {group.keys.map((key) => (
              <div className="form-check form-switch mb-2" key={key}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id={`permission-${user.id}-${key}`}
                  checked={permissions[key]}
                  onChange={() => handleChange(key)}
                  // Same rule as the API: you can change only a permission you have yourself.
                  disabled={!hasPermission(loggedUser, key)}
                />
                <label className="form-check-label" htmlFor={`permission-${user.id}-${key}`}>
                  {PERMISSION_LABELS[key]}
                </label>
              </div>
            ))}
          </div>
        ))}
      </div>

      {loggedUser.role !== "Admin" && (
        <p className="form-text mb-0">
          Możesz nadawać i odbierać tylko te uprawnienia, które sam posiadasz.
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-3">
        <i className="bi bi-check-lg me-2" aria-hidden="true" />
        Zapisz uprawnienia
      </button>
    </form>
  );
}

export default EditPermissionsForm;
