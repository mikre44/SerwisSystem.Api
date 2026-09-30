import { useAuth } from "../context/AuthContext";

import UserInfo from "../components/UserInfoComponents/UserInfo";
import UserPermissions from "../components/UserInfoComponents/UserPermissions";
import UserRepairs from "../components/UserInfoComponents/UserRepairs";
import EditUserForm from "../components/EditFormComponents/EditUserForm";
import ChangePasswordForm from "../components/EditFormComponents/ChangePasswordForm";

function LoggedUser() {
  const { user, reloadUser } = useAuth();

  return (
    <main className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">
          <i className="bi bi-person-circle me-2" />
          Moje konto
        </h1>
      </div>

      <div className="row g-4">
        <div className="col-lg-8 d-flex flex-column gap-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <UserInfo user={user} />
              <hr className="my-3" />
              <EditUserForm key={user.id} user={user} onUpdated={reloadUser} />
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <UserRepairs repairs={user.repairs} />
            </div>
          </div>
        </div>

        <div className="col-lg-4 d-flex flex-column gap-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <UserPermissions permissions={user.permissions} />
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <ChangePasswordForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LoggedUser;
