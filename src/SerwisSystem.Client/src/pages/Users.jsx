import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers } from "../api/api";

const PAGE_SIZE = 10;

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

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
      <h1>Users</h1>

      {error && <p>Error: {error}</p>}

      <form onSubmit={handleSearch}>
        <input
          type="search"
          aria-label="Search users"
          placeholder="Search users..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <button type="submit">
          Search
        </button>
      </form>

      <p>
        Showing {users.length} of {totalCount} users
      </p>

      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort("id")}>
              ID{getSortIndicator("id")}
            </th>

            <th onClick={() => handleSort("username")}>
              Username{getSortIndicator("username")}
            </th>

            <th onClick={() => handleSort("email")}>
              Email{getSortIndicator("email")}
            </th>

            <th onClick={() => handleSort("role")}>
              Role{getSortIndicator("role")}
            </th>

            <th onClick={() => handleSort("priority")}>
              Priority{getSortIndicator("priority")}
            </th>

            <th onClick={() => handleSort("createdAt")}>
              Created{getSortIndicator("createdAt")}
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>

              <td>
                <Link to={`/user/${user.id}`}>
                  {user.username}
                </Link>
              </td>

              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.priority}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>

        <span>
          {" "}
          Page {page} of {totalPages}{" "}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Users;
