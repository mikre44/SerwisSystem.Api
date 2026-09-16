import { useState } from "react";
import { checkRepair } from "../api/api";

function CheckRepair() {
  const [serialNumber, setSerialNumber] = useState("");
  const [email, setEmail] = useState("");

  const [repair, setRepair] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const data = await checkRepair(
        serialNumber,
        email
      );

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
          <label>Serial number: </label>

          <input
            type="text"
            value={serialNumber}
            onChange={(event) =>
              setSerialNumber(event.target.value)
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

          <p>Serial number: {repair.serialNumber}</p>
          <p>Product: {repair.product}</p>
          <p>Status: {repair.status}</p>
          <p>Created: {repair.createdAt}</p>
        </div>
      )}
    </div>
  );
}

export default CheckRepair;