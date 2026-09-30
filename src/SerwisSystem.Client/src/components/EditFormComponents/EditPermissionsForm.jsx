import { useState } from "react";
import { updatePermissions } from "../../api/api";
import { PERMISSION_GROUPS, PERMISSION_KEYS, PERMISSION_LABELS } from "../../permissions";
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
  const [permissions, setPermissions] = useState(() => readPermissions(user));

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(key) {
    setPermissions({
      ...permissions,
      [key]: !permissions[key],
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const permissionsGranted = [];
    const permissionsRevoked = [];

    for (const key of PERMISSION_KEYS) {
      if (permissions[key]) {
        permissionsGranted.push(toApiName(key));
      } else {
        permissionsRevoked.push(toApiName(key));
      }
    }

    try {
      await updatePermissions(user.id, permissionsGranted, permissionsRevoked);

      setError("");
      setSuccess("Uprawnienia zostały zaktualizowane.");

      await onUpdated();
    } catch (error) {
      setSuccess("");
      setError(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Message error={error} success={success} />

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
                />
                <label className="form-check-label" htmlFor={`permission-${user.id}-${key}`}>
                  {PERMISSION_LABELS[key]}
                </label>
              </div>
            ))}
          </div>
        ))}
      </div>

      <button type="submit" className="btn btn-primary mt-3">
        <i className="bi bi-check-lg me-2" aria-hidden="true" />
        Zapisz uprawnienia
      </button>
    </form>
  );
}

export default EditPermissionsForm;
