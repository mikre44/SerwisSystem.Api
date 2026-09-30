import { useState } from "react";
import { correctRepairStatus } from "../../api/api";
import { ALLOWED_STATUS_CORRECTIONS, STATUS_LABELS } from "../../repairStatuses";
import Message from "../Message";

// Admin-only tool for fixing a wrongly set status. Normal status changes go
// through the workflow buttons (EditRepairStatus). After a successful change,
// onUpdated(updatedRepair) receives the repair returned by the API.
function StatusCorrectionForm({ repair, onUpdated }) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const allowedStatuses = ALLOWED_STATUS_CORRECTIONS[repair.status] ?? [];

  if (allowedStatuses.length === 0) {
    return null;
  }

  // The allowed list depends on the current status, so an old choice may no longer fit.
  const newStatus = allowedStatuses.includes(selectedStatus)
    ? selectedStatus
    : allowedStatuses[0];

  async function handleSubmit(event) {
    event.preventDefault();

    const confirmed = window.confirm(
      `Zmienić status z "${STATUS_LABELS[repair.status]}" na "${STATUS_LABELS[newStatus]}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const updatedRepair = await correctRepairStatus(repair.id, newStatus);

      setSuccess("Status został poprawiony.");
      onUpdated(updatedRepair);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h2 className="h6 card-title">Korekta statusu</h2>

        <Message error={error} success={success} />

        <form onSubmit={handleSubmit}>
          <p className="small text-body-secondary mb-2">
            Obecny status: <strong>{STATUS_LABELS[repair.status]}</strong>
          </p>

          <div className="mb-2">
            <label htmlFor="status-correction" className="form-label">
              Nowy status
            </label>
            <select
              id="status-correction"
              className="form-select form-select-sm"
              value={newStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              {allowedStatuses.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          {/* The API unassigns the worker on every correction to Pending. */}
          {newStatus === "Pending" && repair.workerUsername && (
            <p className="small text-body-secondary">
              Pracownik {repair.workerUsername} zostanie odpięty od naprawy.
            </p>
          )}

          <button type="submit" className="btn btn-outline-primary btn-sm" disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {saving ? "Zapisywanie…" : "Zmień status"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StatusCorrectionForm;
