import { displayLabels } from "../displayLabels";
import { useRemoteData } from "../hooks/useRemoteData";
import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { getRepair } from "../api/api";
import { useAuth } from "../context/useAuth";

import EditRepairForm from "../components/EditFormComponents/EditRepairForm";
import EditRepairStatus from "../components/EditFormComponents/EditRepairStatus";
import DeleteRepairButton from "../components/EditFormComponents/DeleteRepairButton";

function Repair() {
  const { id } = useParams();
  const { user } = useAuth();

  const loadRepair = useCallback(signal => getRepair(id, signal), [id]);
  const { data: repair, error, loading, reload } = useRemoteData(loadRepair);
  const canDelete = user.role === "Admin" || user.permissions?.deleteRepairs;
  if (loading) return <p>Wczytywanie naprawy...</p>;

  if (error) {
    return <p>Błąd: {error}</p>;
  }

  if (!repair) {
    return <p>Wczytywanie naprawy...</p>;
  }

  const canEdit =
    user.role === "Admin" ||
    user.permissions?.editRepairs;

  return (
    <div>
      <h1>Naprawa nr{repair.id}</h1>
      <button type="button" onClick={reload}>Wczytaj aktualne dane naprawy</button>

      <h2>Informacje o naprawie</h2>

      <p>Status: {displayLabels[repair.status] ?? "Nieznana wartość"}</p>
      <p> Produkt: {repair.product}
        {repair.isCustomProduct && " (nie z listy)"}
      </p>
      <p>Numer seryjny: {repair.serialNumber || "Brak"}</p>
      <p>Opis: {repair.description}</p>

      <h2>Osoba zgłaszająca</h2>

      <p>Imię: {repair.reporterName}</p>
      <p>Nazwisko: {repair.reporterSurname}</p>
      <p>Telefon: {repair.reporterPhone}</p>
      <p>E-mail: {repair.reporterEmail}</p>

      <h2>Firma</h2>

      <p>Nazwa firmy: {repair.companyName}</p>
      <p>Adres: {repair.companyAddress}</p>
      <p>Kod pocztowy: {repair.companyPostalCode}</p>
      <p>Miasto: {repair.companyCity}</p>
      <p>NIP: {repair.companyNip}</p>

      <h2>Gwarancja</h2>

      <p>
        Naprawa gwarancyjna: {repair.hasWarranty ? "Tak" : "Nie"}
      </p>

      {repair.hasWarranty && (
        <>
          <p>
            Data zakupu:{" "}
            {repair.purchaseDate
              ? new Date(repair.purchaseDate).toLocaleDateString("pl-PL")
              : "Brak"}
          </p>

          <p>
            Numer faktury zakupu:{" "}
            {repair.purchaseInvoiceNumber ?? "Brak"}
          </p>
        </>
      )}

      <h2>Umowa</h2>

      <p>
        Obowiązuje umowa: {repair.hasContract ? "Tak" : "Nie"}
      </p>

      {repair.hasContract && (
        <p>
          Numer umowy: {repair.contractNumber ?? "Brak"}
        </p>
      )}

      <h2>Zgody</h2>

      <p>
        Zgoda na przetwarzanie danych do celów serwisowych:{" "}
        {repair.serviceDataConsent ? "Tak" : "Nie"}
      </p>

      <p>
        Zgoda marketingowa:{" "}
        {repair.marketingConsent ? "Tak" : "Nie"}
      </p>

      <h2>Pracownik</h2>

      <p>
        Pracownik: {repair.workerUsername ?? "Nie przypisano"}
      </p>

      <p>
        Data utworzenia:{" "}
        {new Date(repair.createdAt).toLocaleString("pl-PL")}
      </p>

      <EditRepairStatus
        repair={repair}
        onUpdated={reload}
      />

      {canDelete && (
        <DeleteRepairButton
          repairId={repair.id}
          version={repair.version}
        />
      )}

      {canEdit && (
        <EditRepairForm
          key={`${repair.id}:${repair.version}`}
          repair={repair}
          onUpdated={reload}
        />
      )}
    </div>
  );
}

export default Repair;