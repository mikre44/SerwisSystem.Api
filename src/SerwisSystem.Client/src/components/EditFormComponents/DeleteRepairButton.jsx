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
        message="Are you sure you want to delete this repair?"
        onConfirm={handleDelete}
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Delete repair"}
      </ConfirmButton>
    </div>
  );
}

export default DeleteRepairButton;
