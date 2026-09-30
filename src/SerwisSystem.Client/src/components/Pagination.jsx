// Previous / "Strona X z Y" / next, shared by the repairs and users lists.
function Pagination({ page, totalPages, onPageChange, label = "Strony wyników" }) {
  // The API reports 0 pages for an empty list; show it as "Strona 1 z 1".
  const lastPage = Math.max(totalPages, 1);

  return (
    <nav aria-label={label}>
      <ul className="pagination pagination-sm mb-0">
        <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <i className="bi bi-chevron-left" aria-hidden="true" />
            <span className="visually-hidden">Poprzednia strona</span>
          </button>
        </li>

        <li className="page-item disabled">
          <span className="page-link">
            Strona {page} z {lastPage}
          </span>
        </li>

        <li className={`page-item ${page >= lastPage ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= lastPage}
          >
            <span className="visually-hidden">Następna strona</span>
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;
