import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate  } from "react-router-dom";
import { getRepairs } from "../api/api";
import EditRepairStatus from "../components/EditFormComponents/EditRepairStatus";

function Repairs() {
  const navigate = useNavigate();

  const [repairs, setRepairs] = useState([]);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [mine, setMine] = useState(false);  
  const [sortBy, setSortBy] = useState("createdAt");
  const [descending, setDescending] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  async function loadRepairs() {
    try {
      const data = await getRepairs({
        page,
        pageSize,
        search,
        statuses,
        mine,
        sortBy,
        descending,
      });

      setRepairs(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      setError("");
    } catch (error) {
      setError(error.message);
    }
  }


  function handleSearch(event) {
    event.preventDefault();

    setPage(1);
    loadRepairs();
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


  function handleStatusChange(status){
    setStatuses(statuses => statuses.includes(status) // checks if changed status was on, yes - removes it, no - adds it
    ? statuses.filter(item => item !== status) 
    : [...statuses, status]);

    setPage(1);
  }


  useEffect(() => {
    loadRepairs();
  }, [page, sortBy, descending, statuses, mine]);



  return (
    <div>
      <h1>Repairs</h1>

      {error && <p>Error: {error}</p>}

      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search repairs..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <button type="submit">
          Search
        </button>
      </form>
      

      <div>
        <p>Status:</p>

        {["Pending", "InProgress", "Completed", "Cancelled"].map((status) => (
          <label key={status}>
            <input
              type="checkbox"
              checked={statuses.includes(status)}
              onChange={() => handleStatusChange(status)}
            />

            {status}
          </label>
        ))}
      </div>


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
              ID {sortBy === "id" && (descending ? "▼" : "▲")}
            </th>

            <th onClick={() => handleSort("serialNumber")}>
              Serial number{" "}
              {sortBy === "serialNumber" && (descending ? "▼" : "▲")}
            </th>

            <th onClick={() => handleSort("product")}>
              Product{" "}
              {sortBy === "product" && (descending ? "▼" : "▲")}
            </th>

            <th onClick={() => handleSort("surname")}>
              Reporter{" "}
              {sortBy === "surname" && (descending ? "▼" : "▲")}
            </th>

            <th onClick={() => handleSort("address")}>
              Address{" "}
              {sortBy === "address" && (descending ? "▼" : "▲")}
            </th>

            <th onClick={() => handleSort("status")}>
              Status{" "}
              {sortBy === "status" && (descending ? "▼" : "▲")}
            </th>

            <th>Worker</th>

            <th onClick={() => handleSort("createdAt")}>
              Created{" "}
              {sortBy === "createdAt" && (descending ? "▼" : "▲")}
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
                    onUpdated={loadRepairs}
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
          onClick={() => setPage(page - 1)}>
          Previous
        </button>

        <span>
          {" "}
          Page {page} of {totalPages}{" "}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export default Repairs;