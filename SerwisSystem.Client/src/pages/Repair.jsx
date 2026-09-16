import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRepair } from "../api/api";
import { useAuth } from "../context/AuthContext";

import EditRepairForm from "../components/EditFormComponents/EditRepairForm";
import EditRepairStatus from "../components/EditFormComponents/EditRepairStatus";


function Repair() {
  const { id } = useParams();
  const { user } = useAuth(); 
  const [repair, setRepair] = useState(null);
  const [error, setError] = useState("");

  async function loadRepair() {
    try {
      const data = await getRepair(id);

      setRepair(data);
      setError("");
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    loadRepair();
  }, [id]);

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!repair) {
    return <p>Loading repair...</p>;
  }

  return (
    <div>
      <h1>Repair</h1>

      <p>ID: {repair.id}</p>
      <p>Serial number: {repair.serialNumber}</p>
      <p>Product: {repair.product}</p>
      <p>Description: {repair.description}</p>

      <p>Name: {repair.name}</p>
      <p>Surname: {repair.surname}</p>
      <p>Phone: {repair.phoneNumber}</p>
      <p>Email: {repair.email}</p>
      <p>Address: {repair.address}</p>
      <p>NIP: {repair.nip}</p>

      <p>Status: {repair.status}</p>
      <p>Worker: {repair.workerUsername ?? "Nobody"}</p>
      <p>Created: {repair.createdAt}</p>

      <EditRepairStatus
        repair={repair}
        onUpdated={loadRepair}
      />

      {(user.role === "Admin" ||
      user.permissions?.editRepairs) && (
      <EditRepairForm
        repair={repair}
        onUpdated={loadRepair}
      />
    )}
    </div>
  );
}

export default Repair;