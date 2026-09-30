import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRepair } from "../api/api";
import { useAuth } from "../context/AuthContext";

import EditRepairForm from "../components/EditFormComponents/EditRepairForm";
import EditRepairStatus from "../components/EditFormComponents/EditRepairStatus";
import DeleteRepairButton from "../components/EditFormComponents/DeleteRepairButton";

function Repair() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [repair, setRepair] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Ignore a late response if the user has already opened another repair.
    let ignore = false;

    getRepair(id)
      .then((data) => {
        if (!ignore) {
          setRepair(data);
          setError("");
        }
      })
      .catch((error) => {
        if (!ignore) {
          setError(error.message);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!repair) {
    return <p>Loading repair...</p>;
  }

  const isAdmin = user.role === "Admin";
  const canEdit = isAdmin || user.permissions?.editRepairs;
  const canDelete = isAdmin || user.permissions?.deleteRepairs;

  return (
    <div>
      <h1>Repair #{repair.id}</h1>

      <h2>Repair information</h2>

      <p>Status: {repair.status}</p>
      <p>
        Product: {repair.product}
        {repair.isCustomProduct && " (nie z listy)"}
      </p>
      <p>Serial number: {repair.serialNumber || "None"}</p>
      <p>Description: {repair.description}</p>

      <h2>Reporting person</h2>

      <p>Name: {repair.reporterName}</p>
      <p>Surname: {repair.reporterSurname}</p>
      <p>Phone: {repair.reporterPhone}</p>
      <p>Email: {repair.reporterEmail}</p>

      <h2>Company</h2>

      <p>Company name: {repair.companyName}</p>
      <p>Address: {repair.companyAddress}</p>
      <p>Postal code: {repair.companyPostalCode}</p>
      <p>City: {repair.companyCity}</p>
      <p>NIP: {repair.companyNip}</p>

      <h2>Warranty</h2>

      <p>
        Warranty repair: {repair.hasWarranty ? "Yes" : "No"}
      </p>

      {repair.hasWarranty && (
        <>
          <p>
            Purchase date:{" "}
            {repair.purchaseDate
              ? new Date(repair.purchaseDate).toLocaleDateString()
              : "None"}
          </p>

          <p>
            Purchase invoice number:{" "}
            {repair.purchaseInvoiceNumber ?? "None"}
          </p>
        </>
      )}

      <h2>Contract</h2>

      <p>
        Has contract: {repair.hasContract ? "Yes" : "No"}
      </p>

      {repair.hasContract && (
        <p>
          Contract number: {repair.contractNumber ?? "None"}
        </p>
      )}

      <h2>Consents</h2>

      <p>
        Service data consent:{" "}
        {repair.serviceDataConsent ? "Yes" : "No"}
      </p>

      <p>
        Marketing consent:{" "}
        {repair.marketingConsent ? "Yes" : "No"}
      </p>

      <h2>Worker</h2>

      <p>
        Worker: {repair.workerUsername ?? "Nobody"}
      </p>

      <p>
        Created:{" "}
        {new Date(repair.createdAt).toLocaleString()}
      </p>

      <EditRepairStatus
        repair={repair}
        onUpdated={setRepair}
      />

      {canDelete && (
        <DeleteRepairButton
          repairId={repair.id}
          onDeleted={() => navigate("/repairs")}
        />
      )}

      {canEdit && (
        <EditRepairForm
          repair={repair}
          onUpdated={setRepair}
        />
      )}
    </div>
  );
}

export default Repair;
