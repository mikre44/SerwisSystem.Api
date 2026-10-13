import { useRemoteData } from "../hooks/useRemoteData";
import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { getUser} from "../api/api";
import { useAuth } from "../context/useAuth";

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
  const loadUser = useCallback(signal => getUser(id, signal), [id]);
  const { data: user, error, loading, reload } = useRemoteData(loadUser);
  if (loading) return <p>Wczytywanie użytkownika...</p>;

  if (error) {
    return <p role="alert">Błąd: {error}</p>;
  }

  if (!user) {
    return <p>Wczytywanie użytkownika...</p>;
  }

  return (
    <div>
      <h1>Użytkownik</h1>

        <div className="panel-grid">
        <section className="panel-section"><UserInfo user={user} />
        {(loggedUser.id === user.id ||
        loggedUser.role === "Admin" ||
        loggedUser.permissions?.editUsers) && (
          <EditUserForm
            key={user.id}
            user={user}
            onUpdated={reload}
          />
        )}

        </section><section className="panel-section"><UserPermissions isAdmin={user.role === "Admin"} permissions={user.permissions} />
        {(loggedUser.role === "Admin" ||
          loggedUser.permissions?.grantUsers) && (
          <EditPermissionsForm
            key={user.id}
            user={user}
            onUpdated={reload}
          />
        )}
        </section><section className="panel-section"><h2>Zarządzanie kontem</h2><div className="button-row"><EditAdminButton
          user={user}
          onUpdated={reload}
        />
        <DeleteUserButton user={user} /></div></section>

        <section className="panel-section full-width"><UserRepairs repairs={user.repairs} /></section>
        </div>


    </div>
  );
}

export default User;