import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdmins,
  demoteAdmin,
  updateAdminPriority,
} from "../api/api";

import { useAuth } from "../context/AuthContext";

import EditAdminPriority from "../components/EditFormComponents/EditAdminPriority";
import EditAdminButton from "../components/EditFormComponents/EditAdminButton";

function Admins() {
  const { user: loggedUser } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAdmins() {
    try {
      const data = await getAdmins();

      setAdmins(data);
      setError("");
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  return (
    <div>
      <h1>Admins</h1>

      {error && <p>Error: {error}</p>}
      {success && <p>{success}</p>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {admins.map((admin) => {

            return (
              <tr key={admin.id}>
                <td>
                  <Link to={`/user/${admin.id}`}>
                    {admin.id}
                  </Link>
                </td>

                <td>{admin.username}</td>
                <td>{admin.email}</td>

                <td>
                  <EditAdminPriority
                    admin={admin}
                    loggedUser={loggedUser}
                    onUpdated={loadAdmins}
                  />
                </td>
                <td>
                  <EditAdminButton
                  user={admin}
                  onUpdated={loadAdmins}
                />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Admins;