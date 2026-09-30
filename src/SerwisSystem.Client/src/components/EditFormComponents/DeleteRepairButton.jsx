import { useState } from "react";

import { deleteRepair } from "../../api/api";
import ConfirmButton from "../ConfirmButton";
import Message from "../Message";

// The parent decides what happens after deletion (e.g. navigate back to the list).
function DeleteRepairButton({ repairId, onDeleted }) {
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      setDeleting(true);
      setError("");

      await deleteRepair(repairId);

      onDeleted();
    } catch (error) {
      setError(error.message);
      setDeleting(false);
    }
  }

  return (
    <div>
      <Message error={error} />

      <ConfirmButton
        className="btn btn-outline-danger btn-sm"
        message="Czy na pewno usunąć tę naprawę? Tej operacji nie można cofnąć."
        onConfirm={handleDelete}
        disabled={deleting}
      >
        {deleting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
        <i className="bi bi-trash me-1" aria-hidden="true" />
        {deleting ? "Usuwanie…" : "Usuń naprawę"}
      </ConfirmButton>
    </div>
  );
}

export default DeleteRepairButton;
