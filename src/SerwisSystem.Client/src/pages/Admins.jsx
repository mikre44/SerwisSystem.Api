import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdmins } from "../api/api";
import { useAuth } from "../context/AuthContext";

import EditAdminPriority from "../components/EditFormComponents/EditAdminPriority";
import EditAdminButton from "../components/EditFormComponents/EditAdminButton";

function Admins() {
  const { user: loggedUser } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState("");
  // Changing this number runs the effect again and reloads the list
  // (a demote or a new priority changes which admins are listed and their order).
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    getAdmins()
      .then((data) => {
        if (!ignore) {
          setAdmins(data);
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
  }, [reloadKey]);

  function reloadAdmins() {
    setReloadKey((key) => key + 1);
  }

  return (
    <div>
      <h1>Admins</h1>

      {error && <p>Error: {error}</p>}

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
          {admins.map((admin) => (
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
                  onUpdated={reloadAdmins}
                />
              </td>

              <td>
                <EditAdminButton
                  user={admin}
                  onUpdated={reloadAdmins}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Admins;
