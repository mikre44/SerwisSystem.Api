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
    <div>
      <h2>Korekta statusu</h2>

      <Message error={error} success={success} />

      <form onSubmit={handleSubmit}>
        <p>Obecny status: {STATUS_LABELS[repair.status]}</p>

        <label htmlFor="status-correction">Nowy status</label>
        <select
          id="status-correction"
          value={newStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
        >
          {allowedStatuses.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        {repair.status === "InProgress" && newStatus === "Pending" && (
          <small>Pracownik zostanie odpięty od naprawy.</small>
        )}

        <button type="submit" disabled={saving}>
          {saving ? "Zapisywanie..." : "Zmień status"}
        </button>
      </form>
    </div>
  );
}

export default StatusCorrectionForm;
