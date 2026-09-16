import { useState } from "react";
import { updatePermissions } from "../../api/api";

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

  function handleChange(permission) {
    setPermissions({
      ...permissions,
      [permission]: !permissions[permission],
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const  permissionsGranted = [];
    const  permissionsRevoked = [];

    for (const permission of permissionNames) {
      if (permissions[permission]) {
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
      await onUpdated();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div>
      <h2>Edit permissions</h2>

      {error && <p>Error: {error}</p>}

      <form onSubmit={handleSubmit}>
        {permissionNames.map((permission) => (
          <div key={permission}>
            <label>
              <input
                type="checkbox"
                checked={permissions[permission]}
                onChange={() => handleChange(permission)}
              />

              {permission}
            </label>
          </div>
        ))}

        <button type="submit">
          Save permissions
        </button>
      </form>
    </div>
  );
}

export default EditPermissionsForm;