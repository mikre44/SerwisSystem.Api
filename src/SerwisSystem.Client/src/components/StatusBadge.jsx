import { STATUS_LABELS } from "../repairStatuses";

// Bootstrap colour for each RepairStatus value.
const STATUS_COLORS = {
  Pending: "text-bg-warning",
  InProgress: "text-bg-primary",
  Completed: "text-bg-success",
  Cancelled: "text-bg-secondary",
};

function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_COLORS[status] ?? "text-bg-light"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default StatusBadge;
