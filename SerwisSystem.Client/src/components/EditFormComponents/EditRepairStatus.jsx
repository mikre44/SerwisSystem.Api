import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

import {
  takeRepair,
  completeRepair,
  cancelRepair,
  returnRepair,
} from "../../api/api";

function EditRepairStatus({ repair, onUpdated }) {
  const { user } = useAuth();
  const [error, setError] = useState("");

  const isAdmin = user.role === "Admin";

  const canTake =
    repair.status === "Pending" &&
    !repair.workerUsername &&
    (isAdmin || user.permissions?.takeRepairs);

  const isMyRepair = repair.workerId === user.id;

  const canWorkOnRepair =
    repair.status === "InProgress" &&
    (isAdmin || isMyRepair);

  async function runAction(action) {
    try {
      await action(repair.id);

      setError("");
      await onUpdated();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div>
      {error && <p>Error: {error}</p>}

      {canTake && (
        <button onClick={() => runAction(takeRepair)}>
          Take
        </button>
      )}

      {canWorkOnRepair && (
        <>
          <button onClick={() => runAction(completeRepair)}>
            Complete
          </button>

          <button onClick={() => runAction(cancelRepair)}>
            Cancel
          </button>

          <button onClick={() => runAction(returnRepair)}>
            Return
          </button>
        </>
      )}
    </div>
  );
}

export default EditRepairStatus;