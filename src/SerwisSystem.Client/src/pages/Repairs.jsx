import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRepairs } from "../api/api";
import { STATUS_LABELS } from "../repairStatuses";
import EditRepairStatus from "../components/EditFormComponents/EditRepairStatus";
import StatusBadge from "../components/StatusBadge";
import Message from "../components/Message";

const STATUSES = ["Pending", "InProgress", "Completed", "Cancelled"];
const PAGE_SIZE_OPTIONS = [10, 20, 50];

// One sortable column header. The icon shows the active sort direction,
// or a faint hint that the column can be sorted at all.
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
      className="btn btn-link p-0 text-body fw-bold text-decoration-none d-inline-flex align-items-center gap-1"
      onClick={() => onSort(column)}
      aria-sort={isActive ? (descending ? "descending" : "ascending") : "none"}
    >
      {label}
      <i className={`bi ${icon}`} aria-hidden="true" />
    </button>
  );
}

function Repairs() {
  const navigate = useNavigate();

  const [repairs, setRepairs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // `search` follows the input; `appliedSearch` changes only when the form is submitted.
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [mine, setMine] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [descending, setDescending] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    // Ignore a late response if the filters changed in the meantime.
    // `loading` is only ever cleared here (not set again), so the spinner
    // is shown for the first load but a filter change does not blank out
    // the table while the next page of results is on its way.
    let ignore = false;

    getRepairs({
      page,
      pageSize,
      search: appliedSearch,
      statuses,
      mine,
      sortBy,
      descending,
    })
      .then((data) => {
        if (ignore) {
          return;
        }

        setRepairs(data.items);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
        setError("");
      })
      .catch((error) => {
        if (!ignore) {
          setError(error.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, pageSize, appliedSearch, statuses, mine, sortBy, descending]);

  function handleSearch(event) {
    event.preventDefault();

    setAppliedSearch(search.trim());
    setPage(1);
  }

  function handleSort(column) {
    if (sortBy === column) {
      setDescending(!descending);
    } else {
      setSortBy(column);
      setDescending(true);
    }

    setPage(1);
  }

  function handleStatusChange(status) {
    // Toggle: remove the status if it is selected, add it otherwise.
    setStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status]
    );

    setPage(1);
  }

  // Workflow actions return the updated repair, so only that row is replaced.
  function handleRepairUpdated(updatedRepair) {
    setRepairs((current) =>
      current.map((repair) =>
        repair.id === updatedRepair.id ? updatedRepair : repair
      )
    );
  }

  const isEmpty = !loading && repairs.length === 0;

  return (
    <main className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">
          <i className="bi bi-tools me-2" aria-hidden="true" />
          Naprawy
        </h1>
      </div>

      <Message error={error} />

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <form onSubmit={handleSearch}>
                <label htmlFor="repairs-search" className="form-label">
                  Szukaj
                </label>
                <div className="input-group">
                  <input
                    id="repairs-search"
                    type="search"
                    className="form-control"
                    placeholder="Numer, produkt, zgłaszający…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-search me-1" aria-hidden="true" />
                    Szukaj
                  </button>
                </div>
              </form>
            </div>

            <div className="col-md-7">
              <fieldset className="border-0 p-0 m-0">
                <legend className="form-label fw-semibold h6 mb-2 float-none">
                  Status
                </legend>

                <div className="d-flex flex-wrap gap-2">
                  {STATUSES.map((status) => {
                    const checkboxId = `status-filter-${status}`;

                    return (
                      <div key={status}>
                        <input
                          type="checkbox"
                          className="btn-check"
                          id={checkboxId}
                          autoComplete="off"
                          checked={statuses.includes(status)}
                          onChange={() => handleStatusChange(status)}
                        />
                        <label className="btn btn-outline-secondary btn-sm" htmlFor={checkboxId}>
                          {STATUS_LABELS[status]}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </div>

          <div className="form-check form-switch mt-3 mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="mine-only-switch"
              checked={mine}
              onChange={(event) => {
                setMine(event.target.checked);
                setPage(1);
              }}
            />
            <label className="form-check-label" htmlFor="mine-only-switch">
              Tylko moje
            </label>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className={isEmpty || loading ? "card-body" : "card-body p-0"}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Ładowanie…</span>
              </div>
            </div>
          ) : isEmpty ? (
            <p className="text-body-secondary text-center py-4 mb-0">
              Brak napraw spełniających podane kryteria.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 table-clickable">
                <thead className="table-light">
                  <tr>
                    <th scope="col">
                      <div className="d-flex align-items-center gap-2">
                        <SortButton column="id" label="ID" sortBy={sortBy} descending={descending} onSort={handleSort} />
                        <span className="text-body-tertiary">/</span>
                        <SortButton column="product" label="Produkt" sortBy={sortBy} descending={descending} onSort={handleSort} />
                      </div>
                    </th>

                    <th scope="col" className="d-none d-md-table-cell">
                      <SortButton column="serialNumber" label="Numer seryjny" sortBy={sortBy} descending={descending} onSort={handleSort} />
                    </th>

                    <th scope="col" className="d-none d-sm-table-cell">
                      <SortButton column="reporterSurname" label="Zgłaszający" sortBy={sortBy} descending={descending} onSort={handleSort} />
                    </th>

                    <th scope="col" className="d-none d-md-table-cell">
                      <SortButton column="address" label="Adres" sortBy={sortBy} descending={descending} onSort={handleSort} />
                    </th>

                    <th scope="col">
                      <SortButton column="status" label="Status" sortBy={sortBy} descending={descending} onSort={handleSort} />
                    </th>

                    <th scope="col" className="d-none d-md-table-cell">
                      Serwisant
                    </th>

                    <th scope="col" className="d-none d-md-table-cell">
                      <SortButton column="createdAt" label="Utworzono" sortBy={sortBy} descending={descending} onSort={handleSort} />
                    </th>

                    <th scope="col">Akcje</th>
                  </tr>
                </thead>

                <tbody>
                  {repairs.map((repair) => (
                    <tr key={repair.id} onClick={() => navigate(`/repair/${repair.id}`)}>
                      <td>
                        <Link
                          to={`/repair/${repair.id}`}
                          className="fw-semibold text-decoration-none"
                          onClick={(event) => event.stopPropagation()}
                        >
                          #{repair.id} — {repair.product}
                          {repair.isCustomProduct && (
                            <span className="text-body-secondary"> (nie z listy)</span>
                          )}
                        </Link>
                      </td>

                      <td className="d-none d-md-table-cell">{repair.serialNumber || "—"}</td>

                      <td className="d-none d-sm-table-cell">
                        {repair.reporterName} {repair.reporterSurname}
                      </td>

                      <td className="d-none d-md-table-cell">{repair.companyAddress}</td>

                      <td>
                        <StatusBadge status={repair.status} />
                      </td>

                      <td className="d-none d-md-table-cell">
                        {repair.workerUsername ?? "Nieprzypisany"}
                      </td>

                      <td className="d-none d-md-table-cell">
                        {new Date(repair.createdAt).toLocaleDateString("pl-PL")}
                      </td>

                      <td onClick={(event) => event.stopPropagation()}>
                        <EditRepairStatus repair={repair} onUpdated={handleRepairUpdated} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && (
          <div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-3">
            <span className="text-body-secondary small">
              Wyświetlono {repairs.length} z {totalCount} napraw
            </span>

            <div className="d-flex flex-wrap align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="page-size" className="form-label mb-0 small text-body-secondary">
                  Na stronę
                </label>
                <select
                  id="page-size"
                  className="form-select form-select-sm w-auto"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <nav aria-label="Strony wyników">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      <i className="bi bi-chevron-left" aria-hidden="true" />
                      <span className="visually-hidden">Poprzednia strona</span>
                    </button>
                  </li>

                  <li className="page-item disabled">
                    <span className="page-link">
                      Strona {page} z {totalPages}
                    </span>
                  </li>

                  <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      <span className="visually-hidden">Następna strona</span>
                      <i className="bi bi-chevron-right" aria-hidden="true" />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default Repairs;
