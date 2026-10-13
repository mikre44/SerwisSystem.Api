import { displayLabels } from "../displayLabels";
import PrintRepairButton from "../components/PrintRepairButton";
import RepairNotification from "../components/RepairNotification";
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
    return <p role="alert">Błąd: {error}</p>;
  }

  if (!repair) {
    return <p>Wczytywanie naprawy...</p>;
  }

  const canEdit =
    user.role === "Admin" ||
    user.permissions?.editRepairs;

  return (
    <div>
      <h1>Naprawa nr {repair.id}</h1>
      <div className="button-row">
      <PrintRepairButton repairId={repair.id} />
      <EditRepairStatus repair={repair} onUpdated={reload} />
      <button type="button" onClick={reload}>Wczytaj aktualne dane naprawy</button>
      </div>
      <RepairNotification repair={repair} canEdit={canEdit} onUpdated={reload} />
      <div className="panel-grid repair-details">
      <section className="panel-section">

      <h2>Informacje o naprawie</h2>
      <p>Sposób realizacji: {displayLabels[repair.repairMethod] ?? "Wysyłka"}</p>

      <p>Status: <span className="status-badge" data-status={repair.status}>{displayLabels[repair.status] ?? "Nieznana wartość"}</span></p>
      <p> Produkt: {repair.product}
        {repair.isCustomProduct && " (nie z listy)"}
      </p>
      <p>Numer seryjny: {repair.serialNumber || "Brak"}</p>
      <p>Opis: {repair.description}</p>

      </section><section className="panel-section"><h2>Osoba zgłaszająca</h2>

      <p>Imię: {repair.reporterName}</p>
      <p>Nazwisko: {repair.reporterSurname}</p>
      <p>Telefon: {repair.reporterPhone}</p>
      <p>E-mail: {repair.reporterEmail}</p>

      </section><section className="panel-section"><h2>Firma</h2>

      <p>Nazwa firmy: {repair.companyName}</p>
      <p>Adres: {repair.companyAddress}</p>
      <p>Kod pocztowy: {repair.companyPostalCode}</p>
      <p>Miasto: {repair.companyCity}</p>
      <p>NIP: {repair.companyNip}</p>

      </section><section className="panel-section"><h2>Gwarancja</h2>

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

      </section><section className="panel-section"><h2>Umowa</h2>

      <p>
        Obowiązuje umowa: {repair.hasContract ? "Tak" : "Nie"}
      </p>

      {repair.hasContract && (
        <p>
          Numer umowy: {repair.contractNumber ?? "Brak"}
        </p>
      )}

      </section><section className="panel-section"><h2>Zgody</h2>

      <p>
        Zgoda na przetwarzanie danych do celów serwisowych:{" "}
        {repair.serviceDataConsent ? "Tak" : "Nie"}
      </p>

      <p>
        Zgoda marketingowa:{" "}
        {repair.marketingConsent ? "Tak" : "Nie"}
      </p>

      </section><section className="panel-section"><h2>Pracownik</h2>

      <p>
        Pracownik: {repair.workerUsername ?? "Nie przypisano"}
      </p>

      <p>
        Data utworzenia:{" "}
        {new Date(repair.createdAt).toLocaleString("pl-PL")}
      </p>

      </section>
      </div>

      {canDelete && (
        <DeleteRepairButton
          repairId={repair.id}
          version={repair.version}
        />
      )}

      {canEdit && (
        <section className="panel-section repair-edit-section">
        <EditRepairForm
          key={`${repair.id}:${repair.version}`}
          repair={repair}
          onUpdated={reload}
        />
        </section>
      )}
    </div>
  );
}

export default Repair;
