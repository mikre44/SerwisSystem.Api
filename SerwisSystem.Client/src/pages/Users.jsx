import { displayLabels } from "../displayLabels";
import { useRemoteData } from "../hooks/useRemoteData";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers } from "../api/api";

function Users() {


  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [descending, setDescending] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const loadUsers = useCallback(signal => getUsers({ page, pageSize, search: appliedSearch, sortBy, descending }, signal), [page, pageSize, appliedSearch, sortBy, descending]);
  const { data, error, loading, reload } = useRemoteData(loadUsers);
  const users = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalCount = data?.totalCount ?? 0;
  function handleSearch(event) {
    event.preventDefault(); setAppliedSearch(search); setPage(1); reload();
  }

  function handleSort(column) {
    if (sortBy === column) {
      setDescending(!descending);
    } else {
      setSortBy(column);
      setDescending(false);
    }

    setPage(1);
  }

  function getSortIndicator(column) {
    if (sortBy !== column) {
      return "";
    }

    return descending ? " ▼" : " ▲";
  }

  return (
    <div>
      <h1>Użytkownicy</h1>

      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Wczytywanie...</p>}

      <form className="search-form" role="search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Szukaj użytkowników..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <button type="submit">
          Szukaj
        </button>
      </form>

      <p>
        Wyświetlono {users.length} z {totalCount} użytkowników
      </p>

      <div className="table-scroll" role="region" aria-label="Tabela danych" tabIndex={0}><table>
        <thead>
          <tr>
            <th><button type="button" onClick={() => handleSort("id")}>
              ID{getSortIndicator("id")}
            </button></th>

            <th><button type="button" onClick={() => handleSort("username")}>
              Nazwa użytkownika{getSortIndicator("username")}
            </button></th>

            <th><button type="button" onClick={() => handleSort("email")}>
              E-mail{getSortIndicator("email")}
            </button></th>

            <th><button type="button" onClick={() => handleSort("role")}>
              Rola{getSortIndicator("role")}
            </button></th>

            <th><button type="button" onClick={() => handleSort("priority")}>
              Priorytet{getSortIndicator("priority")}
            </button></th>

            <th><button type="button" onClick={() => handleSort("createdAt")}>
              Data utworzenia{getSortIndicator("createdAt")}
            </button></th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                {user.id}
              </td>

              <td>
                <Link to={`/user/${user.id}`}>
                  {user.username}
                </Link>
              </td>
              <td>{user.email}</td>
              <td>{displayLabels[user.role] ?? "Nieznana wartość"}</td>
              <td>{user.priority}</td>
              <td>{user.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table></div>

      <div>
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Poprzednia
        </button>

        <span>
          {" "}
          Strona {page} z {totalPages}{" "}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Następna
        </button>
      </div>
    </div>
  );
}

export default Users;