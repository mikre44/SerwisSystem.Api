import { useState } from "react";
import { useAuth } from "../../context/useAuth";
import Message from "../Message";
import ConfirmButton from "../ConfirmButton";

import {
  takeRepair,
  completeRepair,
  cancelRepair,
  returnRepair,
} from "../../api/api";

function EditRepairStatus({ repair, onUpdated }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updating, setUpdating] = useState(false);

  const isAdmin = user.role === "Admin";

  const canTake =
    repair.status === "Pending" &&
    !repair.workerUsername &&
    (isAdmin || user.permissions?.takeRepairs);

  const isMyRepair = repair.workerId === user.id;

  const canWorkOnRepair =
    repair.status === "InProgress" &&
    (isAdmin || isMyRepair);

  const canCancel = repair.status !== "Completed" && repair.status !== "Cancelled"
    && (isAdmin || (isMyRepair && user.permissions?.editRepairs));
  const canReturn = repair.status === "InProgress"
    && (isAdmin || isMyRepair || user.permissions?.dischargeUsers);

  async function runAction(action, successMessage) {
    if (updating) return;
    setUpdating(true);
    try {
      await action(repair.id, repair.version);

      setError("");
      setSuccess(successMessage);

      await onUpdated();
    } catch (error) {
      setSuccess("");
      setError(error.message);
    } finally { setUpdating(false); }
  }

  return (
    <div>
      <Message
        error={error}
        success={success}
      />

      {canTake && (
        <button disabled={updating} onClick={() => runAction(takeRepair, "Naprawa została przypisana do Ciebie.")}>
          Przyjmij naprawę
        </button>
      )}

      {canWorkOnRepair && (
        <>
          <button disabled={updating} onClick={() => runAction(completeRepair, "Naprawa została zakończona.")}>
            Zakończ
          </button>

        </>
      )}
      {canCancel && (
          <ConfirmButton
            disabled={updating}
            message="Czy na pewno chcesz anulować tę naprawę?"
            onConfirm={() => runAction(cancelRepair, "Naprawa została anulowana.")}
          >
            Anuluj
          </ConfirmButton>
      )}
      {canReturn && (
          <button disabled={updating} onClick={() => runAction(returnRepair, "Naprawa wróciła do kolejki oczekujących.")}>
            Zwróć do kolejki
          </button>
      )}
    </div>
  );
}

export default EditRepairStatus;