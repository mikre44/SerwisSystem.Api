import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateUser } from "../api/api";

import UserInfo from "../components/UserInfoComponents/UserInfo";
import UserPermissions from "../components/UserInfoComponents/UserPermissions";
import UserRepairs from "../components/UserInfoComponents/UserRepairs";
import EditUserForm from "../components/EditFormComponents/EditUserForm";


function LoggedUser() {
  const { user, reloadUser } = useAuth();

  return (
    <div>
      <h1>My profile</h1>

      <UserInfo user={user} />
      <EditUserForm user={user} onUpdated={reloadUser}/>

      <UserPermissions permissions={user.permissions} />
      <UserRepairs repairs={user.repairs} />

    </div>
  );
}

export default LoggedUser;