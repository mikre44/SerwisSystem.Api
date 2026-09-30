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
function EditRepairStatus({ repair, onUpdated }) {
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

  return (
    <div>
      <Message error={error} success={success} />

      <div className="d-flex flex-wrap gap-2">
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
