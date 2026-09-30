import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

import UserInfo from "../components/UserInfoComponents/UserInfo";
import UserPermissions from "../components/UserInfoComponents/UserPermissions";
import UserRepairs from "../components/UserInfoComponents/UserRepairs";
import EditUserForm from "../components/EditFormComponents/EditUserForm";
import EditPermissionsForm from "../components/EditFormComponents/EditPermissionsForm";
import DeleteUserButton from "../components/EditFormComponents/DeleteUserButton";
import EditAdminButton from "../components/EditFormComponents/EditAdminButton";

function User() {
  const { id } = useParams();
  const { user: loggedUser } = useAuth();

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  // Changing this number runs the effect again and reloads the user.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Ignore a late response if another user has been opened in the meantime.
    let ignore = false;

    getUser(id)
      .then((data) => {
        if (!ignore) {
          setUser(data);
          setError("");
        }
      })
      .catch((error) => {
        if (!ignore) {
          setError(error.message);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id, reloadKey]);

  function reloadUser() {
    setReloadKey((key) => key + 1);
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!user) {
    return <p>Loading user...</p>;
  }

  const canEditUser =
    loggedUser.id === user.id ||
    loggedUser.role === "Admin" ||
    loggedUser.permissions?.editUsers;

  const canGrantPermissions =
    loggedUser.role === "Admin" ||
    loggedUser.permissions?.grantUsers;

  // key={user.id}: the forms copy the user into their own state,
  // so opening another user must create fresh forms.
  return (
    <div>
      <h1>User</h1>

      <UserInfo user={user} />

      {canEditUser && (
        <EditUserForm
          key={user.id}
          user={user}
          onUpdated={reloadUser}
        />
      )}

      <UserPermissions permissions={user.permissions} />

      {canGrantPermissions && (
        <EditPermissionsForm
          key={user.id}
          user={user}
          onUpdated={reloadUser}
        />
      )}

      <EditAdminButton
        user={user}
        onUpdated={reloadUser}
      />

      <DeleteUserButton user={user} />

      <UserRepairs repairs={user.repairs} />
    </div>
  );
}

export default User;
