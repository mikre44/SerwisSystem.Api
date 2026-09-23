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

function EditRepairStatus({ repair, onUpdated }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    try {
      await action(repair.id);

      setError("");
      setSuccess(successMessage);

      await onUpdated();
    } catch (error) {
      setSuccess("");
      setError(error.message);
    }
  }

  return (
    <div>
      <Message
        error={error}
        success={success}
      />

      {canTake && (
        <button onClick={() => runAction(takeRepair, "Repair taken successfully.")}>
          Take
        </button>
      )}

      {canWorkOnRepair && (
        <>
          <button onClick={() => runAction(completeRepair, "Repair completed successfully.")}>
            Complete
          </button>

          <ConfirmButton
            message="Are you sure you want to cancel this repair?"
            onConfirm={() => runAction(cancelRepair, "Repair cancelled successfully.")}
          >
            Cancel
          </ConfirmButton>

          <button onClick={() => runAction(returnRepair, "Repair returned successfully.")}>
            Return
          </button>
        </>
      )}
    </div>
  );
}

export default EditRepairStatus;