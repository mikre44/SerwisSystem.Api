// A sortable column header button, shared by the repairs and users lists.
// The icon shows the active sort direction, or a faint hint that the column
// can be sorted at all. The hidden text tells screen readers the same thing.
function SortButton({ column, label, sortBy, descending, onSort }) {
  const isActive = sortBy === column;
  const icon = isActive
    ? descending
      ? "bi-sort-down"
      : "bi-sort-up"
    : "bi-sort-down opacity-25";

  return (
    <button
      type="button"
      className="btn btn-link btn-sm p-0 text-body fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
      onClick={() => onSort(column)}
    >
      {label}
      <i className={`bi ${icon}`} aria-hidden="true" />
      {isActive && (
        <span className="visually-hidden">
          {descending ? " (sortowanie malejące)" : " (sortowanie rosnące)"}
        </span>
      )}
    </button>
  );
}

export default SortButton;
