import { useState } from "react";
import { deleteRepair } from "../../api/api";
import ConfirmButton from "../ConfirmButton";

function DeleteRepairButton({ repairId, onDeleted }) {
  const [error, setError] = useState("");

  async function handleDelete() {
    try {
      setError("");

      await deleteRepair(repairId);

      if (onDeleted) {
        await onDeleted();
      }
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div>
      {error && <p>Error: {error}</p>}

      <ConfirmButton
        message="Are you sure you want to delete this repair?"
        onConfirm={handleDelete}
      >
        Delete repair
      </ConfirmButton>
    </div>
  );
}

export default DeleteRepairButton;