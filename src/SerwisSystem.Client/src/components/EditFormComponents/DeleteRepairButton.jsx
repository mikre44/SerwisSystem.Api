import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteRepair } from "../../api/api";
import ConfirmButton from "../ConfirmButton";

function DeleteRepairButton({ repairId }) {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      setDeleting(true);
      setError("");

      await deleteRepair(repairId);

      navigate("/repairs");
    } catch (error) {
      setError(error.message);
      setDeleting(false);
    }
  }

  return (
    <div>
      {error && (
        <p>
          Error: {error}
        </p>
      )}

      <ConfirmButton
        message="Are you sure you want to delete this repair?"
        onConfirm={handleDelete}
        disabled={deleting}
      >
        {deleting
          ? "Deleting..."
          : "Delete repair"}
      </ConfirmButton>
    </div>
  );
}

export default DeleteRepairButton;