import { useState } from "react";
import { checkRepair } from "../api/api";

function CheckRepair() {
  const [repairId, setRepairId] = useState("");
  const [email, setEmail] = useState("");

  const [repair, setRepair] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const data = await checkRepair({
      id: Number(repairId),
      email: email.trim(),
    });

      setRepair(data);
      setError("");
    } catch (error) {
      setRepair(null);
      setError(error.message);
    }
  }

  return (
    <div>
      <h1>Check repair</h1>

      {error && <p>Error: {error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Id: </label>

          <input
            type="text"
            value={repairId}
            onChange={(event) =>
              setRepairId(event.target.value)
            }
          />
        </div>

        <div>
          <label>Email: </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
          />
        </div>

        <button type="submit">
          Check
        </button>
      </form>

      {repair && (
        <div>
          <h2>Repair information</h2>

          <p>Product: {repair.product}</p>
          <p>Status: {repair.status}</p>
          <p>Created: {repair.createdAt}</p>
        </div>
      )}
    </div>
  );
}

export default CheckRepair;