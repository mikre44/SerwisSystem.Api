import { displayLabels } from "../../displayLabels";
import { Link } from "react-router-dom";

function UserRepairs({ repairs }) {
  if (!repairs || repairs.length === 0) {
    return (
      <div>
        <h2>Naprawy</h2>
        <p>Brak przypisanych napraw.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Naprawy</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Numer seryjny</th>
            <th>Produkt</th>
            <th>Osoba zgłaszająca</th>
            <th>Adres</th>
            <th>Status</th>
            <th>Data utworzenia</th>
          </tr>
        </thead>

        <tbody>
          {repairs.map((repair) => (
            <tr key={repair.id}>
              <td>
                <Link to={`/repair/${repair.id}`}>
                  #{repair.id}
                </Link>
              </td>

              <td>
                {repair.serialNumber || "-"}
              </td>

              <td>
                {repair.product}
              </td>

              <td>
                {repair.reporterName}{" "}
                {repair.reporterSurname}
              </td>

              <td>
                {repair.companyAddress}
              </td>

              <td>
                {displayLabels[repair.status] ?? "Nieznana wartość"}
              </td>

              <td>
                {new Date(
                  repair.createdAt
                ).toLocaleDateString("pl-PL")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserRepairs;