import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

import UserInfo from "../components/UserInfoComponents/UserInfo";
import UserPermissions from "../components/UserInfoComponents/UserPermissions";
import UserRepairs from "../components/UserInfoComponents/UserRepairs";
import EditUserForm from "../components/EditFormComponents/EditUserForm";
import EditPermissionsForm from "../components/EditFormComponents/EditPermissionsForm";

function User() {
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const { user: loggedUser } = useAuth();

    async function loadUser() {
      try {
        const data = await getUser(id);

        setUser(data);
      } catch (error) {
        setError(error.message);
      }
    }
  useEffect(() => {
    loadUser();
  }, [id]);

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!user) {
    return <p>Loading user...</p>;
  }
  
  return (
    <div>
      <h1>User</h1>

        <UserInfo user={user} />
        {(loggedUser.id === user.id ||
        loggedUser.role === "Admin" ||
        loggedUser.permissions?.editUsers) && (
          <EditUserForm
            user={user}
            onUpdated={loadUser}
          />
        )}
        
        <UserPermissions permissions={user.permissions} />
        {(loggedUser.role === "Admin" ||
          loggedUser.permissions?.grantUsers) && (
          <EditPermissionsForm
            user={user}
            onUpdated={loadUser}
          />
        )}
        <UserRepairs repairs={user.repairs} />
    </div>
  );
}

export default User;