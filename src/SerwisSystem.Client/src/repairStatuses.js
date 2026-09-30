// Polish labels for the RepairStatus values sent by the API.
export const STATUS_LABELS = {
  Pending: "Oczekująca",
  InProgress: "W trakcie",
  Completed: "Zakończona",
  Cancelled: "Anulowana",
};

// Corrections an admin may make with PUT /api/repairs/{id}/status.
// Mirrors the transition table in the API, which rejects anything else with 400.
export const ALLOWED_STATUS_CORRECTIONS = {
  Pending: ["Cancelled"],
  InProgress: ["Pending", "Cancelled"],
  Completed: ["InProgress"],
  Cancelled: ["Pending"],
};
