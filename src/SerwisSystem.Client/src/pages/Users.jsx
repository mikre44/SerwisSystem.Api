import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUsers } from "../api/api";
import { PERMISSION_KEYS } from "../permissions";
import Message from "../components/Message";
import Pagination from "../components/Pagination";
import SortButton from "../components/SortButton";

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
  const navigate = useNavigate();

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
    // As in Repairs, `loading` is only cleared here, so the spinner is shown
    // for the first load but a filter change does not blank out the table.
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

  function handleSearch(event) {
    event.preventDefault();

    setAppliedSearch(search.trim());
    setPage(1);
  }

  // Names and e-mails read best A→Z, so a new column starts ascending.
  function handleSort(column) {
    if (sortBy === column) {
      setDescending(!descending);
    } else {
      setSortBy(column);
      setDescending(false);
    }

    setPage(1);
  }

  const isEmpty = !loading && users.length === 0;
  const sortProps = { sortBy, descending, onSort: handleSort };

  return (
    <main className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">
          <i className="bi bi-people me-2" aria-hidden="true" />
          Użytkownicy
        </h1>
      </div>

      <Message error={error} />

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form className="col-md-6" onSubmit={handleSearch}>
            <label htmlFor="users-search" className="form-label">
              Szukaj
            </label>
            <div className="input-group">
              <input
                id="users-search"
                type="search"
                className="form-control"
                placeholder="Nazwa użytkownika, e-mail, rola…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-search me-1" aria-hidden="true" />
                Szukaj
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className={isEmpty || loading ? "card-body" : "card-body p-0"}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Ładowanie…</span>
              </div>
            </div>
          ) : isEmpty ? (
            <p className="text-body-secondary text-center py-4 mb-0">
              Brak użytkowników spełniających podane kryteria.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 table-clickable">
                <thead className="table-light">
                  <tr>
                    <th scope="col">
                      <SortButton column="id" label="ID" {...sortProps} />
                    </th>
                    <th scope="col">
                      <SortButton column="username" label="Nazwa użytkownika" {...sortProps} />
                    </th>
                    <th scope="col" className="d-none d-md-table-cell">
                      <SortButton column="email" label="E-mail" {...sortProps} />
                    </th>
                    <th scope="col">
                      <SortButton column="role" label="Rola" {...sortProps} />
                    </th>
                    <th scope="col" className="d-none d-md-table-cell">
                      <SortButton column="priority" label="Priorytet" {...sortProps} />
                    </th>
                    <th scope="col" className="d-none d-md-table-cell">
                      Uprawnienia
                    </th>
                    <th scope="col" className="d-none d-md-table-cell">
                      <SortButton column="createdAt" label="Utworzono" {...sortProps} />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} onClick={() => navigate(`/user/${user.id}`)}>
                      <td>{user.id}</td>

                      <td>
                        <Link
                          to={`/user/${user.id}`}
                          className="fw-semibold text-decoration-none"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {user.username}
                        </Link>
                      </td>

                      <td className="d-none d-md-table-cell">{user.email}</td>

                      <td>
                        <span className={`badge ${roleBadgeClass(user.role)}`}>
                          {roleLabel(user.role)}
                        </span>
                      </td>

                      <td className="d-none d-md-table-cell">
                        {user.role === "Admin" ? user.priority : "—"}
                      </td>

                      <td className="d-none d-md-table-cell">
                        {user.role === "Admin" ? (
                          <span className="text-body-secondary">wszystkie</span>
                        ) : (
                          <span className="badge text-bg-secondary">
                            {countPermissions(user.permissions)}/{PERMISSION_KEYS.length}
                          </span>
                        )}
                      </td>

                      <td className="d-none d-md-table-cell">
                        {new Date(user.createdAt).toLocaleDateString("pl-PL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && (
          <div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-3">
            <span className="text-body-secondary small">
              Wyświetlono {users.length} z {totalCount} użytkowników
            </span>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              label="Strony użytkowników"
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default Users;
