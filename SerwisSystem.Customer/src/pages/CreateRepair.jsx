import { useState } from "react";
import { createRepair } from "../api/api";

function CreateRepair() {
  const [product, setProduct] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [address, setAddress] = useState("");
  const [nip, setNip] = useState("");

  const [error, setError] = useState("");
  const [createdRepair, setCreatedRepair] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (email !== confirmEmail) {
      setError("Emails do not match.");
      return;
    }

    try {
      const repair = await createRepair({
        serialNumber,
        product,
        description,
        name,
        surname,
        phoneNumber,
        email,
        address,
        nip,
      });

      setCreatedRepair(repair);
      setError("");
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div>
      <h1>Create repair</h1>

      {error && <p>Error: {error}</p>}

      {createdRepair && (
        <div>
          <h2>Repair created</h2>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Product: </label>
          <input
            required
            value={product}
            onChange={(event) => setProduct(event.target.value)}
          />
        </div>

        <div>
          <label>Device serial number: </label>
          <input
            required
            type="text"
            value={serialNumber}
            onChange={(event) => setSerialNumber(event.target.value)}
          />
        </div>

        <div>
          <label>Description: </label>
          <textarea
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div>
          <label>Name: </label>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div>
          <label>Surname: </label>
          <input
            required
            value={surname}
            onChange={(event) => setSurname(event.target.value)}
          />
        </div>

        <div>
          <label>Phone: </label>
          <input
            required
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
          />
        </div>

        <div>
          <label>Email: </label>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div>
          <label>Confirm email: </label>
          <input
            required
            type="email"
            value={confirmEmail}
            onChange={(event) => setConfirmEmail(event.target.value)}
          />
        </div>

        <div>
          <label>Address: </label>
          <input
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </div>

        <div>
          <label>NIP: </label>
          <input
            required
            value={nip}
            onChange={(event) => setNip(event.target.value)}
          />
        </div>

        <button type="submit">
          Send repair
        </button>
      </form>
    </div>
  );
}

export default CreateRepair;