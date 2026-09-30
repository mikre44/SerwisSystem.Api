import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../permissions";
import Message from "../Message";
import ConfirmButton from "../ConfirmButton";

import {
  takeRepair,
  completeRepair,
  cancelRepair,
  returnRepair,
} from "../../api/api";

// Workflow buttons (take / complete / cancel / return).
// Every action returns the updated repair, which is passed to onUpdated(updatedRepair).
function EditRepairStatus({ repair, onUpdated }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  // Each flag mirrors the matching action in the API's RepairsController,
  // so a button is shown only when the request would be allowed.
  const isAdmin = user.role === "Admin";
  const isMyRepair = repair.workerId === user.id;
  const isInProgress = repair.status === "InProgress";

  // take: TakeRepairs, and only a pending repair nobody has taken yet.
  const canTake =
    repair.status === "Pending" &&
    repair.workerId == null &&
    hasPermission(user, "takeRepairs");

  // complete: the assigned worker or an admin.
  const canComplete = isInProgress && (isAdmin || isMyRepair);

  // cancel: EditRepairs AND (the assigned worker or an admin);
  // completed and cancelled repairs cannot be cancelled.
  const canCancel =
    (repair.status === "Pending" || isInProgress) &&
    hasPermission(user, "editRepairs") &&
    (isAdmin || isMyRepair);

  // return: the assigned worker or anyone with DischargeUsers (admins have it too).
  const canReturn = isInProgress && (isMyRepair || hasPermission(user, "dischargeUsers"));

  const hasAnyAction = canTake || canComplete || canCancel || canReturn;

  async function runAction(action, successMessage) {
    setBusy(true);

    try {
      const updatedRepair = await action(repair.id);

      setError("");
      setSuccess(successMessage);
      onUpdated(updatedRepair);
    } catch (error) {
      setSuccess("");
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Message error={error} success={success} />

      <div className="d-flex flex-wrap gap-2">
        {!hasAnyAction && (
          <span className="text-body-secondary small">Brak akcji</span>
        )}

        {canTake && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={() => runAction(takeRepair, "Naprawa została przyjęta.")}
          >
            {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            <i className="bi bi-play-fill me-1" aria-hidden="true" />
            Przyjmij
          </button>
        )}

        {canComplete && (
          <button
            type="button"
            className="btn btn-success btn-sm"
            disabled={busy}
            onClick={() => runAction(completeRepair, "Naprawa została zakończona.")}
          >
            <i className="bi bi-check2-circle me-1" aria-hidden="true" />
            Zakończ
          </button>
        )}

        {canCancel && (
          <ConfirmButton
            className="btn btn-outline-danger btn-sm"
            message="Czy na pewno anulować tę naprawę?"
            onConfirm={() => runAction(cancelRepair, "Naprawa została anulowana.")}
            disabled={busy}
          >
            <i className="bi bi-x-circle me-1" aria-hidden="true" />
            Anuluj
          </ConfirmButton>
        )}

        {canReturn && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={busy}
            onClick={() => runAction(returnRepair, "Naprawa została zwrócona do kolejki.")}
          >
            <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true" />
            Zwróć
          </button>
        )}
      </div>
    </div>
  );
}

export default EditRepairStatus;
