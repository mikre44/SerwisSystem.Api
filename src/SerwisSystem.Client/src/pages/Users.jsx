import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers } from "../api/api";
import { PERMISSION_KEYS } from "../permissions";

const PAGE_SIZE = 10;

function roleBadgeClass(role) {
  return role === "Admin" ? "text-bg-dark" : "text-bg-light border";
}

function roleLabel(role) {
  return role === "Admin" ? "Administrator" : "Pracownik";
}

function countPermissions(permissions) {
  if (!permissions) {
    return 0;
  }

  return Object.values(permissions).filter(Boolean).length;
}

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // `search` follows the input; `appliedSearch` changes only when the form is submitted.
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [descending, setDescending] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    // Ignore a late response if the filters changed in the meantime.
    let ignore = false;

    getUsers({
      page,
      pageSize: PAGE_SIZE,
      search: appliedSearch,
      sortBy,
      descending,
    })
      .then((data) => {
        if (ignore) {
          return;
        }

        setUsers(data.items);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
        setError("");
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
  }, [page, appliedSearch, sortBy, descending]);

  // `setLoading(true)` is triggered here rather than inside the effect, so the
  // effect only ever calls setState from its async callbacks.
  function handleSearch(event) {
    event.preventDefault();

    setLoading(true);
    setAppliedSearch(search.trim());
    setPage(1);
  }

  function handleSort(column) {
    setLoading(true);

    if (sortBy === column) {
      setDescending(!descending);
    } else {
      setSortBy(column);
      setDescending(false);
    }

    setPage(1);
  }

  function goToPage(newPage) {
    setLoading(true);
    setPage(newPage);
  }

  function renderSortableHeader(column, label) {
    const isActive = sortBy === column;

    return (
      <th scope="col" aria-sort={isActive ? (descending ? "descending" : "ascending") : "none"}>
        <button
          type="button"
          className="btn btn-link p-0 text-decoration-none text-reset fw-semibold d-inline-flex align-items-center gap-1"
          onClick={() => handleSort(column)}
        >
          {label}
          {isActive && (
            <i
              className={`bi bi-caret-${descending ? "down" : "up"}-fill`}
              aria-hidden="true"
            />
          )}
        </button>
      </th>
    );
  }

  return (
    <main className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">
          <i className="bi bi-people me-2" aria-hidden="true" />
          Użytkownicy
        </h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form className="row g-2 align-items-center" onSubmit={handleSearch}>
            <div className="col-sm-8 col-md-6">
              <label htmlFor="users-search" className="visually-hidden">
                Szukaj użytkowników
              </label>
              <input
                id="users-search"
                type="search"
                className="form-control"
                placeholder="Szukaj po nazwie lub e-mailu…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="col-auto">
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-search me-2" aria-hidden="true" />
                Szukaj
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header">
          Wyświetlono {users.length} z {totalCount} użytkowników
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Ładowanie…</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <p className="text-body-secondary text-center py-4 mb-0">
            Nie znaleziono żadnych użytkowników.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  {renderSortableHeader("id", "ID")}
                  {renderSortableHeader("username", "Nazwa użytkownika")}
                  {renderSortableHeader("email", "E-mail")}
                  {renderSortableHeader("role", "Rola")}
                  {renderSortableHeader("priority", "Priorytet")}
                  <th scope="col">Uprawnienia</th>
                  {renderSortableHeader("createdAt", "Utworzono")}
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>

                    <td>
                      <Link to={`/user/${user.id}`}>{user.username}</Link>
                    </td>

                    <td>{user.email}</td>

                    <td>
                      <span className={`badge ${roleBadgeClass(user.role)}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>

                    <td>{user.role === "Admin" ? user.priority : "—"}</td>

                    <td>
                      {user.role === "Admin" ? (
                        <span className="text-body-secondary">—</span>
                      ) : (
                        <span className="badge text-bg-secondary">
                          {countPermissions(user.permissions)}/{PERMISSION_KEYS.length}
                        </span>
                      )}
                    </td>

                    <td>{new Date(user.createdAt).toLocaleDateString("pl-PL")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Strony użytkowników" className="d-flex justify-content-center mt-4">
          <ul className="pagination mb-0">
            <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                Poprzednia
              </button>
            </li>

            <li className="page-item disabled">
              <span className="page-link">
                Strona {page} z {totalPages}
              </span>
            </li>

            <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Następna
              </button>
            </li>
          </ul>
        </nav>
      )}
    </main>
  );
}

export default Users;
