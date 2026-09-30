import { PERMISSION_KEYS, PERMISSION_LABELS } from "../../permissions";

// Read-only view of a user's permission flags. Headless (no card of its own)
// so it can be dropped into any card body.
function UserPermissions({ permissions }) {
  if (!permissions) {
    return <p className="text-body-secondary mb-0">Brak uprawnień.</p>;
  }

  return (
    <ul className="list-inline mb-0">
      {PERMISSION_KEYS.map((key) => (
        <li className="list-inline-item mb-2" key={key}>
          <span
            className={`badge ${
              permissions[key] ? "text-bg-success" : "text-bg-light border text-body-secondary"
            }`}
          >
            {permissions[key] && <i className="bi bi-check-lg me-1" aria-hidden="true" />}
            {PERMISSION_LABELS[key]}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default UserPermissions;
