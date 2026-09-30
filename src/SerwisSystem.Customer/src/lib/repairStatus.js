// Polish labels for RepairStatus values, matching the staff app
// (SerwisSystem.Client/src/components/EditFormComponents/EditRepairForm.jsx).
export const STATUS_LABELS = {
  Pending: "Oczekująca",
  InProgress: "W trakcie",
  Completed: "Zakończona",
  Cancelled: "Anulowana",
};

export const STATUS_BADGE_CLASS = {
  Pending: "bg-warning text-dark",
  InProgress: "bg-primary",
  Completed: "bg-success",
  Cancelled: "bg-secondary",
};
