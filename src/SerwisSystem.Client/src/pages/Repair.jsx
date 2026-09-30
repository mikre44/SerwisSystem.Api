import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRepair } from "../api/api";
import { useAuth } from "../context/AuthContext";

import EditRepairForm from "../components/EditFormComponents/EditRepairForm";
import EditRepairStatus from "../components/EditFormComponents/EditRepairStatus";
import DeleteRepairButton from "../components/EditFormComponents/DeleteRepairButton";
import StatusCorrectionForm from "../components/EditFormComponents/StatusCorrectionForm";
import StatusBadge from "../components/StatusBadge";
import Message from "../components/Message";

// One label/value pair in the read-only repair view.
function InfoField({ label, value, className = "col-md-6" }) {
  return (
    <div className={className}>
      <div className="text-body-secondary small">{label}</div>
      <div>{value}</div>
    </div>
  );
}

// Shown instead of EditRepairForm to users without the editRepairs permission,
// so they can still see the full repair data (mirrors the sections of the edit form).
function ReadOnlyRepairDetails({ repair }) {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h2 className="h6 text-uppercase text-body-secondary border-bottom pb-2 mb-3">
          Urządzenie
        </h2>

        <div className="row g-3 mb-4">
          <InfoField
            label="Produkt"
            value={`${repair.product}${repair.isCustomProduct ? " (nie z listy)" : ""}`}
          />
          <InfoField label="Numer seryjny" value={repair.serialNumber || "Brak"} />
          <InfoField label="Opis usterki" value={repair.description} className="col-12" />
        </div>

        <h2 className="h6 text-uppercase text-body-secondary border-bottom pb-2 mb-3">
          Zgłaszający
        </h2>

        <div className="row g-3 mb-4">
          <InfoField label="Imię" value={repair.reporterName} />
          <InfoField label="Nazwisko" value={repair.reporterSurname} />
          <InfoField label="Telefon" value={repair.reporterPhone} />
          <InfoField label="E-mail" value={repair.reporterEmail} />
        </div>

        <h2 className="h6 text-uppercase text-body-secondary border-bottom pb-2 mb-3">
          Firma
        </h2>

        <div className="row g-3 mb-4">
          <InfoField label="Nazwa firmy" value={repair.companyName} />
          <InfoField label="Adres" value={repair.companyAddress} />
          <InfoField label="Kod pocztowy" value={repair.companyPostalCode} />
          <InfoField label="Miasto" value={repair.companyCity} />
          <InfoField label="NIP" value={repair.companyNip} />
        </div>

        <h2 className="h6 text-uppercase text-body-secondary border-bottom pb-2 mb-3">
          Gwarancja i umowa
        </h2>

        <div className="row g-3 mb-4">
          <InfoField label="Naprawa gwarancyjna" value={repair.hasWarranty ? "Tak" : "Nie"} />

          {repair.hasWarranty && (
            <>
              <InfoField
                label="Data zakupu"
                value={
                  repair.purchaseDate
                    ? new Date(repair.purchaseDate).toLocaleDateString("pl-PL")
                    : "Brak"
                }
              />
              <InfoField label="Numer faktury" value={repair.purchaseInvoiceNumber ?? "Brak"} />
            </>
          )}

          <InfoField label="Zgłoszenie w ramach umowy" value={repair.hasContract ? "Tak" : "Nie"} />

          {repair.hasContract && (
            <InfoField label="Numer umowy" value={repair.contractNumber ?? "Brak"} />
          )}
        </div>

        <h2 className="h6 text-uppercase text-body-secondary border-bottom pb-2 mb-3">
          Zgody
        </h2>

        <div className="row g-3">
          <InfoField
            label="Zgoda na przetwarzanie danych"
            value={repair.serviceDataConsent ? "Tak" : "Nie"}
          />
          <InfoField
            label="Zgoda marketingowa"
            value={repair.marketingConsent ? "Tak" : "Nie"}
          />
        </div>
      </div>
    </div>
  );
}

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
    return (
      <main className="container py-4">
        <Message error={error} />
      </main>
    );
  }

  if (!repair) {
    return (
      <main className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Ładowanie…</span>
          </div>
        </div>
      </main>
    );
  }

  const isAdmin = user.role === "Admin";
  const canEdit = isAdmin || user.permissions?.editRepairs;
  const canDelete = isAdmin || user.permissions?.deleteRepairs;

  return (
    <main className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div className="d-flex align-items-center gap-2">
          <h1 className="h3 mb-0">Naprawa #{repair.id}</h1>
          <StatusBadge status={repair.status} />
        </div>

        <Link to="/repairs" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1" aria-hidden="true" />
          Powrót do listy
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          {canEdit ? (
            <EditRepairForm key={repair.id} repair={repair} onUpdated={setRepair} />
          ) : (
            <ReadOnlyRepairDetails repair={repair} />
          )}
        </div>

        <div className="col-lg-4 d-flex flex-column gap-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h6 card-title">Akcje</h2>
              <EditRepairStatus repair={repair} onUpdated={setRepair} />
            </div>
          </div>

          {isAdmin && (
            <StatusCorrectionForm repair={repair} onUpdated={setRepair} />
          )}

          <div className="card shadow-sm">
            <div className="card-body">
              <dl className="row mb-0 small">
                <dt className="col-6 text-body-secondary fw-normal">Przypisany serwisant</dt>
                <dd className="col-6 text-end mb-2">{repair.workerUsername ?? "Nieprzypisany"}</dd>

                <dt className="col-6 text-body-secondary fw-normal mb-0">Utworzono</dt>
                <dd className="col-6 text-end mb-0">
                  {new Date(repair.createdAt).toLocaleString("pl-PL")}
                </dd>
              </dl>
            </div>
          </div>

          {canDelete && (
            <div className="card border-danger-subtle shadow-sm">
              <div className="card-header bg-danger-subtle text-danger-emphasis">
                Strefa zagrożenia
              </div>
              <div className="card-body">
                <p className="small text-body-secondary">
                  Usunięcie naprawy jest nieodwracalne.
                </p>
                <DeleteRepairButton
                  repairId={repair.id}
                  onDeleted={() => navigate("/repairs")}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default Repair;
