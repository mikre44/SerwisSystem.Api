import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdmins } from "../api/api";
import { useAuth } from "../context/AuthContext";

import EditAdminPriority from "../components/EditFormComponents/EditAdminPriority";
import EditAdminButton from "../components/EditFormComponents/EditAdminButton";
import Message from "../components/Message";

function Admins() {
  const { user: loggedUser } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
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
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
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
    <main className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <h1 className="h3 mb-0">
          <i className="bi bi-shield-lock me-2" />
          Administratorzy
        </h1>
      </div>

      <p className="text-body-secondary mb-4">
        Im niższy numer priorytetu, tym większa władza administratora. Możesz
        zarządzać tylko administratorami, których priorytet jest wyższy (czyli
        mniej ważny) niż Twój.
      </p>

      <Message error={error} />

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Ładowanie…</span>
              </div>
            </div>
          ) : admins.length === 0 ? (
            <p className="text-body-secondary text-center py-4 mb-0">
              Brak administratorów do wyświetlenia.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Nazwa użytkownika</th>
                    <th scope="col" className="d-none d-md-table-cell">E-mail</th>
                    <th scope="col">Priorytet</th>
                    <th scope="col" className="text-end">Akcje</th>
                  </tr>
                </thead>

                <tbody>
                  {admins.map((admin) => {
                    const isSelf = admin.id === loggedUser.id;

                    return (
                      <tr key={admin.id} className={isSelf ? "table-primary" : undefined}>
                        <td>
                          <Link to={`/user/${admin.id}`}>{admin.username}</Link>
                          {isSelf && (
                            <span className="badge text-bg-primary ms-2">Ty</span>
                          )}
                        </td>

                        <td className="d-none d-md-table-cell">{admin.email}</td>

                        <td style={{ minWidth: "8rem" }}>
                          <EditAdminPriority
                            admin={admin}
                            loggedUser={loggedUser}
                            onUpdated={reloadAdmins}
                          />
                        </td>

                        <td className="text-end text-nowrap">
                          <EditAdminButton user={admin} onUpdated={reloadAdmins} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default Admins;
