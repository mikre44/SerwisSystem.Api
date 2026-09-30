const PERMISSION_LABELS = [
  { key: "readRepairs", label: "Odczyt napraw" },
  { key: "takeRepairs", label: "Przyjmowanie napraw" },
  { key: "editRepairs", label: "Edycja napraw" },
  { key: "deleteRepairs", label: "Usuwanie napraw" },
  { key: "readUsers", label: "Odczyt użytkowników" },
  { key: "editUsers", label: "Edycja użytkowników" },
  { key: "deleteUsers", label: "Usuwanie użytkowników" },
  { key: "grantUsers", label: "Nadawanie uprawnień" },
  { key: "dischargeUsers", label: "Odbieranie uprawnień" },
];

// Read-only view of a user's permission flags. Headless (no card of its own)
// so it can be dropped into any card body.
function UserPermissions({ permissions }) {
  if (!permissions) {
    return <p className="text-body-secondary mb-0">Brak uprawnień.</p>;
  }

  return (
    <ul className="list-inline mb-0">
      {PERMISSION_LABELS.map(({ key, label }) => (
        <li className="list-inline-item mb-2" key={key}>
          <span
            className={`badge ${
              permissions[key] ? "text-bg-success" : "text-bg-light border text-body-secondary"
            }`}
          >
            {permissions[key] && <i className="bi bi-check-lg me-1" aria-hidden="true" />}
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default UserPermissions;
