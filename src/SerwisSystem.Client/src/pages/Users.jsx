import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers } from "../api/api";

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [descending, setDescending] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  async function loadUsers(customPage = page) {
    try {
      const data = await getUsers({
        page: customPage,
        pageSize,
        search,
        sortBy,
        descending,
      });

      setUsers(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      setError("");
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [page, sortBy, descending]);

  async function handleSearch(event) {
    event.preventDefault();

    setPage(1);
    await loadUsers(1);
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
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
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
              <td>
                {user.id}
              </td>

              <td>
                <Link to={`/user/${user.id}`}>
                  {user.username}
                </Link>
              </td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.priority}</td>
              <td>{user.createdAt}</td>
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