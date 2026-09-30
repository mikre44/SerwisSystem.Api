import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
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
// `compact` is for a table row: no success alert (the row's status badge already
// changes) and a one-line error, so the row does not grow into a large box.
function EditRepairStatus({ repair, onUpdated, compact = false }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const isAdmin = user.role === "Admin";

  const canTake =
    repair.status === "Pending" &&
    !repair.workerUsername &&
    (isAdmin || user.permissions?.takeRepairs);

  const isMyRepair = repair.workerId === user.id;

  const canWorkOnRepair =
    repair.status === "InProgress" &&
    (isAdmin || isMyRepair);

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

  const hasActions = canTake || canWorkOnRepair;

  return (
    <div>
      {compact ? (
        error && <div className="small text-danger mb-1">{error}</div>
      ) : (
        <Message error={error} success={success} />
      )}

      {!hasActions && !compact && (
        <p className="small text-body-secondary mb-0">
          Brak dostępnych akcji dla tej naprawy.
        </p>
      )}

      {/* text-nowrap: buttons may move to the next line, but a label never breaks. */}
      <div className="d-flex flex-wrap gap-2 text-nowrap">
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

        {canWorkOnRepair && (
          <>
            <button
              type="button"
              className="btn btn-success btn-sm"
              disabled={busy}
              onClick={() => runAction(completeRepair, "Naprawa została zakończona.")}
            >
              <i className="bi bi-check2-circle me-1" aria-hidden="true" />
              Zakończ
            </button>

            <ConfirmButton
              className="btn btn-outline-danger btn-sm"
              message="Czy na pewno anulować tę naprawę?"
              onConfirm={() => runAction(cancelRepair, "Naprawa została anulowana.")}
              disabled={busy}
            >
              <i className="bi bi-x-circle me-1" aria-hidden="true" />
              Anuluj
            </ConfirmButton>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={busy}
              onClick={() => runAction(returnRepair, "Naprawa została zwrócona.")}
            >
              <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true" />
              Zwróć
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default EditRepairStatus;
