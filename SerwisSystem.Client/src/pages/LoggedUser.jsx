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

      <UserInfo user={user} />
      <EditUserForm user={user} onUpdated={refreshProfile}/>
      <ChangePasswordForm />
      <UserPermissions isAdmin={user.role === "Admin"} permissions={user.permissions} />
      <UserRepairs repairs={user.repairs} />

    </div>
  );
}

export default LoggedUser;