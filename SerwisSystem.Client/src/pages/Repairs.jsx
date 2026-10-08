import { displayLabels } from "../displayLabels";
import { useRemoteData } from "../hooks/useRemoteData";
import { Fragment, useCallback, useState } from "react";
import { useNavigate  } from "react-router-dom";
import { getRepairs } from "../api/api";
import EditRepairStatus from "../components/EditFormComponents/EditRepairStatus";

function Repairs() {
  const navigate = useNavigate();



  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [mine, setMine] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [descending, setDescending] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const loadRepairs = useCallback(signal => getRepairs({ page, pageSize, search: appliedSearch, sortBy, descending, statuses, mine }, signal), [page, pageSize, appliedSearch, sortBy, descending, statuses, mine]);
  const { data, error, loading, reload } = useRemoteData(loadRepairs);
  const repairs = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalCount = data?.totalCount ?? 0;
  function handleSearch(event) {
    event.preventDefault(); setAppliedSearch(search); setPage(1); reload();
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





  function handleStatusChange(status){
    setStatuses(statuses => statuses.includes(status) // checks if changed status was on, yes - removes it, no - adds it
    ? statuses.filter(item => item !== status)
    : [...statuses, status]);

    setPage(1);
  }






  return (
    <div>
      <h1>Naprawy</h1>

      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Wczytywanie...</p>}

      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Szukaj napraw..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <button type="submit">
          Szukaj
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

            {displayLabels[status] ?? "Nieznana wartość"}
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

          Tylko moje naprawy
        </label>
      </div>

      <p>
        Wyświetlono {repairs.length} z {totalCount} napraw
      </p>

      <table>
        <thead>
          <tr>
            <th><button type="button" onClick={() => handleSort("id")}>
              ID {sortBy === "id" && (descending ? "▼" : "▲")}
            </button></th>

            <th><button type="button" onClick={() => handleSort("serialNumber")}>
              Numer seryjny{" "}
              {sortBy === "serialNumber" && (descending ? "▼" : "▲")}
            </button></th>

            <th><button type="button" onClick={() => handleSort("product")}>
              Produkt{" "}
              {sortBy === "product" && (descending ? "▼" : "▲")}
            </button></th>

            <th><button type="button" onClick={() => handleSort("reporterSurname")}>
              Osoba zgłaszająca{" "}
              {sortBy === "reporterSurname" && (descending ? "▼" : "▲")}
            </button></th>

            <th><button type="button" onClick={() => handleSort("address")}>
              Adres{" "}
              {sortBy === "address" && (descending ? "▼" : "▲")}
            </button></th>

            <th><button type="button" onClick={() => handleSort("status")}>
              Status{" "}
              {sortBy === "status" && (descending ? "▼" : "▲")}
            </button></th>

            <th>Pracownik</th>

            <th><button type="button" onClick={() => handleSort("createdAt")}>
              Data utworzenia{" "}
              {sortBy === "createdAt" && (descending ? "▼" : "▲")}
            </button></th>
          </tr>
        </thead>

        <tbody>
          {repairs.map((repair) => (
            <Fragment key={repair.id}>
              <tr
                tabIndex={0}
                onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(`/repair/${repair.id}`); } }}
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

                <td>{displayLabels[repair.status] ?? "Nieznana wartość"}</td>

                <td>
                  {repair.workerUsername ?? "Nie przypisano"}
                </td>

                <td>
                  {new Date(repair.createdAt).toLocaleDateString("pl-PL")}
                </td>
              </tr>

              <tr>
                <td colSpan="8">
                  <EditRepairStatus
                    repair={repair}
                    onUpdated={reload}
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
          Poprzednia
        </button>

        <span>
          {" "}
          Strona {page} z {totalPages}{" "}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}>
          Następna
        </button>
      </div>
    </div>
  );
}

export default Repairs;