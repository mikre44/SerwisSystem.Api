import { useEffect, useState } from "react";
import { getUsers } from "../api/api";

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

      {repairs.map((repair) => (
        <div key={repair.id}>
          <hr />

          <p>ID: {repair.id}</p>
          <p>Serial number: {repair.serialNumber}</p>
          <p>Product: {repair.product}</p>
          <p>Status: {repair.status}</p>
          <p>Worker: {repair.workerUsername ?? "Nobody"}</p>

          {repair.status === "Pending" && (
            <button onClick={() => handleTake(repair.id)}>
              Take
            </button>
          )}

          {repair.status === "InProgress" && (
            <>
              <button onClick={() => handleComplete(repair.id)}>
                Complete
              </button>

              <button onClick={() => handleCancel(repair.id)}>
                Cancel
              </button>

              <button onClick={() => handleReturn(repair.id)}>
                Return
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default Users;