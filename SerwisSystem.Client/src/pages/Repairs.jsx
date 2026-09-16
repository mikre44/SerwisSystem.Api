import { useEffect, useState } from "react";
import { getRepairs } from "../api/api";
import { Link } from "react-router-dom";

function Repairs() {
  const [repairs, setRepairs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRepairs() {
      try {
        const data = await getRepairs();
        setRepairs(data);
      } catch (error) {
        setError(error.message);
      }
    }

    loadRepairs();
  }, []);

  return (
    <div>
      <h1>Repairs</h1>

      {error && <p>Error: {error}</p>}

      {repairs.map((repair) => (
        <div key={repair.id}>
          <hr />

          <p>
            ID:{" "}
            <Link to={`/repair/${repair.id}`}>
              {repair.id}
            </Link>
          </p>

          <p>Serial number: {repair.serialNumber}</p>
          <p>Product: {repair.product}</p>
          <p>Status: {repair.status}</p>
          <p>Worker: {repair.workerUsername ?? "Nobody"}</p>

          <EditRepairStatus
            repair={repair}
            onUpdated={loadRepairs}
          />
        </div>
      ))}
    </div>
  );
}

export default Repairs;