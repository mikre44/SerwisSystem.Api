import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRepairs } from "../api/api";
import EditRepairStatus from "../components/EditFormComponents/EditRepairStatus";

const PAGE_SIZE = 10;
const STATUSES = ["Pending", "InProgress", "Completed", "Cancelled"];

function Repairs() {
  const navigate = useNavigate();

  const [repairs, setRepairs] = useState([]);
  const [error, setError] = useState("");

  // `search` follows the input; `appliedSearch` changes only when the form is submitted.
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [mine, setMine] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [descending, setDescending] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    // Ignore a late response if the filters changed in the meantime.
    let ignore = false;

    getRepairs({
      page,
      pageSize: PAGE_SIZE,
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
      });

    return () => {
      ignore = true;
    };
  }, [page, appliedSearch, statuses, mine, sortBy, descending]);

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

  function getSortIndicator(column) {
    if (sortBy !== column) {
      return "";
    }

    return descending ? " ▼" : " ▲";
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

  return (
    <div>
      <h1>Repairs</h1>

      {error && <p>Error: {error}</p>}

      <form onSubmit={handleSearch}>
        <input
          type="search"
          aria-label="Search repairs"
          placeholder="Search repairs..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <button type="submit">
          Search
        </button>
      </form>

      <fieldset>
        <legend>Status</legend>

        {STATUSES.map((status) => (
          <label key={status}>
            <input
              type="checkbox"
              checked={statuses.includes(status)}
              onChange={() => handleStatusChange(status)}
            />

            {status}
          </label>
        ))}
      </fieldset>

      <div>
        <label>
          <input
            type="checkbox"
            checked={mine}
            onChange={(event) => {
              setMine(event.target.checked);
              setPage(1);
            }}
          />

          My repairs only
        </label>
      </div>

      <p>
        Showing {repairs.length} of {totalCount} repairs
      </p>

      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort("id")}>
              ID{getSortIndicator("id")}
            </th>

            <th onClick={() => handleSort("serialNumber")}>
              Serial number{getSortIndicator("serialNumber")}
            </th>

            <th onClick={() => handleSort("product")}>
              Product{getSortIndicator("product")}
            </th>

            <th onClick={() => handleSort("surname")}>
              Reporter{getSortIndicator("surname")}
            </th>

            <th onClick={() => handleSort("address")}>
              Address{getSortIndicator("address")}
            </th>

            <th onClick={() => handleSort("status")}>
              Status{getSortIndicator("status")}
            </th>

            <th>Worker</th>

            <th onClick={() => handleSort("createdAt")}>
              Created{getSortIndicator("createdAt")}
            </th>
          </tr>
        </thead>

        <tbody>
          {repairs.map((repair) => (
            <Fragment key={repair.id}>
              <tr
                onClick={() => navigate(`/repair/${repair.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td>{repair.id}</td>

                <td>{repair.serialNumber || "-"}</td>

                <td>
                  {repair.product}
                  {repair.isCustomProduct && " (nie z listy)"}
                </td>

                <td>
                  {repair.reporterName} {repair.reporterSurname}
                </td>

                <td>
                  {repair.companyAddress}
                </td>

                <td>{repair.status}</td>

                <td>
                  {repair.workerUsername ?? "Nobody"}
                </td>

                <td>
                  {new Date(repair.createdAt).toLocaleDateString()}
                </td>
              </tr>

              <tr>
                <td colSpan="8">
                  <EditRepairStatus
                    repair={repair}
                    onUpdated={handleRepairUpdated}
                  />
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>

      <div>
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>

        <span>
          {" "}
          Page {page} of {totalPages}{" "}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Repairs;
