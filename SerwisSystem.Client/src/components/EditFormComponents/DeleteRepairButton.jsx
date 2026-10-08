import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteRepair } from "../../api/api";
import ConfirmButton from "../ConfirmButton";

function DeleteRepairButton({ repairId, version }) {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      setDeleting(true);
      setError("");

      await deleteRepair(repairId, version);

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
          Błąd: {error}
        </p>
      )}

      <ConfirmButton
        message="Czy na pewno chcesz usunąć tę naprawę?"
        onConfirm={handleDelete}
        disabled={deleting}
      >
        {deleting
          ? "Usuwanie..."
          : "Usuń naprawę"}
      </ConfirmButton>
    </div>
  );
}

export default DeleteRepairButton;