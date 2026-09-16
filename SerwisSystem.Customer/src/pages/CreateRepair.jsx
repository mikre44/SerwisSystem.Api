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
  const [address, setAddress] = useState("");
  const [nip, setNip] = useState("");

  const [error, setError] = useState("");
  const [createdRepair, setCreatedRepair] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

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
            value={product}
            onChange={(event) => setProduct(event.target.value)}
          />
        </div>
        
        <div>
          <label>Device serial number: </label>

          <input
            type="text"
            value={serialNumber}
            onChange={(event) => setSerialNumber(event.target.value)}
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
          Send repair
        </button>
      </form>
    </div>
  );
}

export default CreateRepair;