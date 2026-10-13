import { useRemoteData } from "../hooks/useRemoteData";
import { useAuth } from "../context/useAuth";
import { getLoggedUser } from "../api/api";

import UserInfo from "../components/UserInfoComponents/UserInfo";
import UserPermissions from "../components/UserInfoComponents/UserPermissions";
import UserRepairs from "../components/UserInfoComponents/UserRepairs";
import EditUserForm from "../components/EditFormComponents/EditUserForm";
import ChangePasswordForm from "../components/EditFormComponents/ChangePasswordForm";


function LoggedUser() {
  const { reloadUser } = useAuth();
  const { data: user, error, loading, reload } = useRemoteData(getLoggedUser);
  async function refreshProfile() { await reloadUser(); reload(); }
  if (loading) return <p>Wczytywanie profilu...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1>Mój profil</h1>

      <div className="panel-grid">
      <section className="panel-section"><UserInfo user={user} /></section>
      <section className="panel-section"><EditUserForm user={user} onUpdated={refreshProfile}/></section>
      <section className="panel-section"><ChangePasswordForm /></section>
      <section className="panel-section"><UserPermissions isAdmin={user.role === "Admin"} permissions={user.permissions} /></section>
      <section className="panel-section full-width"><UserRepairs repairs={user.repairs} /></section>
      </div>

    </div>
  );
}

export default LoggedUser;