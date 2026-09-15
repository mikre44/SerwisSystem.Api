function UserPermissions({ permissions }) {
  if (!permissions) {
    return <p>No permissions found.</p>;
  }

  return (
    <div>
      <h2>Privileges</h2>

      <p>Read repairs: {permissions.readRepairs ? "Yes" : "No"}</p>
      <p>Take repairs: {permissions.takeRepairs ? "Yes" : "No"}</p>
      <p>Edit repairs: {permissions.editRepairs ? "Yes" : "No"}</p>
      <p>Delete repairs: {permissions.deleteRepairs ? "Yes" : "No"}</p>

      <p>Read users: {permissions.readUsers ? "Yes" : "No"}</p>
      <p>Edit users: {permissions.editUsers ? "Yes" : "No"}</p>
      <p>Delete users: {permissions.deleteUsers ? "Yes" : "No"}</p>
      <p>Grant users: {permissions.grantUsers ? "Yes" : "No"}</p>
      <p>
        Discharge users: {permissions.dischargeUsers ? "Yes" : "No"}
      </p>
    </div>
  );
}

export default UserPermissions;