import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRepairs } from "../api/api";
import EditRepairStatus from "../components/EditFormComponents/EditRepairStatus";

function Repairs() {
  const [repairs, setRepairs] = useState([]);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
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

  useEffect(() => {
    loadRepairs();
  }, [page, sortBy, descending]);

  async function handleSearch(event) {
    event.preventDefault();

    try {
      const data = await getRepairs({
        page: 1,
        pageSize,
        search,
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
              Customer{getSortIndicator("surname")}
            </th>
            <th onClick={() => handleSort("status")}>
              Status{getSortIndicator("status")}
            </th>
            <th>
              Worker
            </th>
            <th onClick={() => handleSort("createdAt")}>
              Created{getSortIndicator("createdAt")}
            </th>
          </tr>
        </thead>

        <tbody>
          {repairs.map((repair) => (
            <Fragment key={repair.id}>
              <tr>
                <td>
                  <Link to={`/repair/${repair.id}`}>
                    {repair.id}
                  </Link>
                </td>

                <td>{repair.serialNumber}</td>
                <td>{repair.product}</td>

                <td>
                  {repair.name} {repair.surname}
                </td>

                <td>{repair.status}</td>

                <td>
                  {repair.workerUsername ?? "Nobody"}
                </td>

                <td>{repair.createdAt}</td>
              </tr>

              <tr>
                <td colSpan="7">
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