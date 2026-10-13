import { useState } from "react";
import { retryRepairNotification } from "../api/api";

export default function RepairNotification({ repair, canEdit, onUpdated }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  if (!repair.repairMethodNotificationPending) return null;

  async function retry() {
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const updatedRepair = await retryRepairNotification(repair.id, repair.version);
      if (updatedRepair.repairMethodNotificationPending) {
        setError("Nie udało się wysłać powiadomienia. Sprawdź konfigurację poczty i spróbuj ponownie.");
      } else {
        onUpdated();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setSending(false);
    }
  }

  return <div>
    <p role="alert">Zapisano naprawę, ale wysłanie powiadomienia e-mail nie zostało potwierdzone.</p>
    {error && <p role="alert">{error}</p>}
    {canEdit && <button type="button" disabled={sending} onClick={retry}>
      {sending ? "Wysyłanie..." : "Ponów wysyłkę powiadomienia"}
    </button>}
  </div>;
}
