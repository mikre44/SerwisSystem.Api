import { useState } from "react";
import { checkRepair } from "../api/api";
import { STATUS_LABELS, STATUS_BADGE_CLASS } from "../lib/repairStatus";

function CheckRepair() {
  const [repairId, setRepairId] = useState("");
  const [email, setEmail] = useState("");

  const [repair, setRepair] = useState(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const id = Number(repairId);

    if (!repairId.trim() || Number.isNaN(id)) {
      setError("Podaj prawidłowy numer zgłoszenia.");
      setRepair(null);
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const data = await checkRepair({ id, email: email.trim() });
      setRepair(data);
    } catch (err) {
      setRepair(null);
      setError(err.message);
      setFieldErrors(err.fieldErrors || {});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: "560px" }}>
      <h1 className="mb-4">Sprawdź status naprawy</h1>

      <div className="card mb-3">
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="repairId" className="form-label">
                Numer zgłoszenia
              </label>
              <input
                id="repairId"
                type="number"
                className={`form-control${fieldErrors.id ? " is-invalid" : ""}`}
                value={repairId}
                onChange={(event) => setRepairId(event.target.value)}
                required
              />
              {fieldErrors.id && (
                <div className="invalid-feedback">
                  {fieldErrors.id.join(" ")}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className={`form-control${fieldErrors.email ? " is-invalid" : ""}`}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              {fieldErrors.email && (
                <div className="invalid-feedback">
                  {fieldErrors.email.join(" ")}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                />
              )}
              {loading ? "Sprawdzanie..." : "Sprawdź"}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {repair && (
        <div className="card">
          <div className="card-body">
            <h2 className="h5 card-title">Informacje o naprawie</h2>

            <dl className="row mb-0">
              <dt className="col-sm-4">Numer zgłoszenia</dt>
              <dd className="col-sm-8">{repair.id}</dd>

              <dt className="col-sm-4">Produkt</dt>
              <dd className="col-sm-8">{repair.product}</dd>

              {repair.serialNumber && (
                <>
                  <dt className="col-sm-4">Numer seryjny</dt>
                  <dd className="col-sm-8">{repair.serialNumber}</dd>
                </>
              )}

              <dt className="col-sm-4">Status</dt>
              <dd className="col-sm-8">
                <span
                  className={`badge ${STATUS_BADGE_CLASS[repair.status] ?? "bg-secondary"}`}
                >
                  {STATUS_LABELS[repair.status] ?? repair.status}
                </span>
              </dd>

              <dt className="col-sm-4">Data zgłoszenia</dt>
              <dd className="col-sm-8">
                {new Date(repair.createdAt).toLocaleString()}
              </dd>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckRepair;
