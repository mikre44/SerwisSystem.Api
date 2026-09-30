// Polish labels for RepairStatus values. Kept in sync with the staff app's
// own copy in SerwisSystem.Client/src/repairStatuses.js -- both apps show
// the same labels for the same statuses.
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
