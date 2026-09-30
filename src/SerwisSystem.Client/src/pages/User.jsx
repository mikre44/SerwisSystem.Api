import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

import UserInfo from "../components/UserInfoComponents/UserInfo";
import UserPermissions from "../components/UserInfoComponents/UserPermissions";
import UserRepairs from "../components/UserInfoComponents/UserRepairs";
import EditUserForm from "../components/EditFormComponents/EditUserForm";
import EditPermissionsForm from "../components/EditFormComponents/EditPermissionsForm";
import DeleteUserButton from "../components/EditFormComponents/DeleteUserButton";
import EditAdminButton from "../components/EditFormComponents/EditAdminButton";
import EditAdminPriority from "../components/EditFormComponents/EditAdminPriority";

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
    return (
      <main className="container py-4">
        <div className="alert alert-danger">{error}</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Ładowanie…</span>
          </div>
        </div>
      </main>
    );
  }

  const isAdmin = user.role === "Admin";

  const canEditUser =
    loggedUser.id === user.id ||
    loggedUser.role === "Admin" ||
    loggedUser.permissions?.editUsers;

  const canGrantPermissions =
    loggedUser.role === "Admin" || loggedUser.permissions?.grantUsers;

  // Mirrors EditAdminButton's own "not self" check, so we never show an
  // admin-actions card that would end up empty on a viewer's own profile.
  const showAdminActions = loggedUser.role === "Admin" && loggedUser.id !== user.id;

  // key={user.id}: the forms copy the user into their own state,
  // so opening another user must create fresh forms.
  return (
    <main className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-person" aria-hidden="true" />
          {user.username}
          <span className={`badge ${isAdmin ? "text-bg-dark" : "text-bg-light border"}`}>
            {isAdmin ? "Administrator" : "Pracownik"}
          </span>
        </h1>

        <Link to="/users" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-2" aria-hidden="true" />
          Powrót do listy
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-lg-8 d-flex flex-column gap-4">
          {canEditUser && (
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 card-title mb-0">Dane użytkownika</h2>
              </div>
              <div className="card-body">
                <EditUserForm key={user.id} user={user} onUpdated={reloadUser} />
              </div>
            </div>
          )}

          <div className="card shadow-sm">
            <div className="card-header">
              <h2 className="h5 card-title mb-0">Uprawnienia</h2>
            </div>
            <div className="card-body">
              {canGrantPermissions ? (
                <EditPermissionsForm key={user.id} user={user} onUpdated={reloadUser} />
              ) : (
                <UserPermissions permissions={user.permissions} />
              )}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header">
              <h2 className="h5 card-title mb-0">Naprawy użytkownika</h2>
            </div>
            <UserRepairs repairs={user.repairs} />
          </div>
        </div>

        <div className="col-lg-4 d-flex flex-column gap-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h2 className="h5 card-title mb-0">Podsumowanie</h2>
            </div>
            <div className="card-body">
              <UserInfo user={user} />
            </div>
          </div>

          {showAdminActions && (
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 card-title mb-0">Zarządzanie administracją</h2>
              </div>
              <div className="card-body d-flex flex-column gap-3">
                {isAdmin && (
                  <div>
                    <span className="text-body-secondary me-2">Priorytet:</span>
                    <EditAdminPriority admin={user} loggedUser={loggedUser} onUpdated={reloadUser} />
                  </div>
                )}

                <EditAdminButton user={user} onUpdated={reloadUser} />
              </div>
            </div>
          )}

          <DeleteUserButton user={user} />
        </div>
      </div>
    </main>
  );
}

export default User;
