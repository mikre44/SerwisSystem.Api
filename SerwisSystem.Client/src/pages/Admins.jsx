import { useRemoteData } from "../hooks/useRemoteData";
import { Link } from "react-router-dom";
import {
  getAdmins,
} from "../api/api";

import { useAuth } from "../context/useAuth";

import EditAdminPriority from "../components/EditFormComponents/EditAdminPriority";
import EditAdminButton from "../components/EditFormComponents/EditAdminButton";

function Admins() {
  const { user: loggedUser } = useAuth();

  const { data, error, loading, reload } = useRemoteData(getAdmins);
  const admins = data ?? [];
  if (loading) return <p>Wczytywanie administratorów...</p>;

  return (
    <div>
      <h1>Administratorzy</h1>

      {error && <p role="alert">Błąd: {error}</p>}


      <div className="table-scroll" role="region" aria-label="Tabela danych" tabIndex={0}><table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nazwa użytkownika</th>
            <th>E-mail</th>
            <th>Priorytet</th>
            <th>Działania</th>
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
                    onUpdated={reload}
                  />
                </td>
                <td>
                  <EditAdminButton
                  user={admin}
                  onUpdated={reload}
                />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
    </div>
  );
}

export default Admins;