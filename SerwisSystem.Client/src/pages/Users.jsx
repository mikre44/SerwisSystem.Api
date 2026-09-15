import { useEffect, useState } from "react";
import { getUsers } from "../api/api";
import { Link } from "react-router-dom";

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  
  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        setError(error.message);
      }
    }

    loadUsers();
  }, []);

  return (
    <div>
      <h1>Users</h1>

      {error && <p>Error: {error}</p>}

      {users.map((user) => (
        <div key={user.id}>
          <hr />

          <p>ID: {user.id}</p>

          <p>
            Username:{" "}
            <Link to={`/user/${user.id}`}>
              {user.username}
            </Link>
          </p>

          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
          <p>Priority: {user.priority}</p>
        </div>
      ))}
    </div>
  );
}

export default Users;