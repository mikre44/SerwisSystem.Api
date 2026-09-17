import { useState } from "react";
import { updateRepair } from "../../api/api";

function EditRepairForm({ repair, onUpdated }) {
  const [status, setStatus] = useState(repair.status);
  const [product, setProduct] = useState(repair.product);
  const [description, setDescription] = useState(repair.description);
  const [name, setName] = useState(repair.name);
  const [surname, setSurname] = useState(repair.surname);
  const [phoneNumber, setPhoneNumber] = useState(repair.phoneNumber);
  const [email, setEmail] = useState(repair.email);
  const [address, setAddress] = useState(repair.address);
  const [nip, setNip] = useState(repair.nip);

  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await updateRepair(repair.id, {
        status,
        product,
        description,
        name,
        surname,
        phoneNumber,
        email,
        address,
        nip,
      });

      setError("");
      await onUpdated();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div>
      <h2>Edit repair</h2>

      {error && <p>Error: {error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Status: </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="InProgress">InProgress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label>Product: </label>

          <input
            value={product}
            onChange={(event) => setProduct(event.target.value)}
          />
        </div>

        <div>
          <label>Description: </label>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div>
          <label>Name: </label>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div>
          <label>Surname: </label>

          <input
            value={surname}
            onChange={(event) => setSurname(event.target.value)}
          />
        </div>

        <div>
          <label>Phone: </label>

          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
          />
        </div>

        <div>
          <label>Email: </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div>
          <label>Address: </label>

          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </div>

        <div>
          <label>NIP: </label>

          <input
            value={nip}
            onChange={(event) => setNip(event.target.value)}
          />
        </div>

        <button type="submit">
          Save repair
        </button>
      </form>
    </div>
  );
}

export default EditRepairForm;