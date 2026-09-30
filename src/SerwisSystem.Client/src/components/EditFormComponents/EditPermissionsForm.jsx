import { useState } from "react";
import { updatePermissions } from "../../api/api";
import Message from "../Message";

// Drives the submit logic (which permissions are granted vs. revoked).
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

// Same permissions, grouped and labelled in Polish for the toggle grid below.
const REPAIR_PERMISSIONS = [
  { key: "ReadRepairs", label: "Odczyt napraw" },
  { key: "TakeRepairs", label: "Przyjmowanie napraw" },
  { key: "EditRepairs", label: "Edycja napraw" },
  { key: "DeleteRepairs", label: "Usuwanie napraw" },
];

const USER_PERMISSIONS = [
  { key: "ReadUsers", label: "Odczyt użytkowników" },
  { key: "EditUsers", label: "Edycja użytkowników" },
  { key: "DeleteUsers", label: "Usuwanie użytkowników" },
  { key: "GrantUsers", label: "Nadawanie uprawnień" },
  { key: "DischargeUsers", label: "Odbieranie uprawnień" },
];

// Edits a user's permission flags. Headless (no card of its own) — the page
// that uses it provides the surrounding card and title.
function EditPermissionsForm({ user, onUpdated }) {
  const [permissions, setPermissions] = useState({
    ReadRepairs: user.permissions?.readRepairs ?? false,
    TakeRepairs: user.permissions?.takeRepairs ?? false,
    EditRepairs: user.permissions?.editRepairs ?? false,
    DeleteRepairs: user.permissions?.deleteRepairs ?? false,
    ReadUsers: user.permissions?.readUsers ?? false,
    EditUsers: user.permissions?.editUsers ?? false,
    DeleteUsers: user.permissions?.deleteUsers ?? false,
    GrantUsers: user.permissions?.grantUsers ?? false,
    DischargeUsers: user.permissions?.dischargeUsers ?? false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(permission) {
    setPermissions({
      ...permissions,
      [permission]: !permissions[permission],
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const permissionsGranted = [];
    const permissionsRevoked = [];

    for (const permission of permissionNames) {
      if (permissions[permission]) {
        permissionsGranted.push(permission);
      } else {
        permissionsRevoked.push(permission);
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

  function renderGroup(title, items) {
    return (
      <div className="col-sm-6">
        <h3 className="h6 text-body-secondary text-uppercase mb-3">{title}</h3>

        {items.map(({ key, label }) => (
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
              {label}
            </label>
          </div>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Message error={error} success={success} />

      <div className="row g-4">
        {renderGroup("Naprawy", REPAIR_PERMISSIONS)}
        {renderGroup("Użytkownicy", USER_PERMISSIONS)}
      </div>

      <button type="submit" className="btn btn-primary mt-3">
        <i className="bi bi-check-lg me-2" aria-hidden="true" />
        Zapisz uprawnienia
      </button>
    </form>
  );
}

export default EditPermissionsForm;
