import { Link } from "react-router-dom";
import StatusBadge from "../StatusBadge";

// Compact list of repairs linked to a user. Headless (no card of its own) so
// it can be dropped into any card body — the user detail page and the
// logged-in user's own profile page both use it this way.
function UserRepairs({ repairs }) {
  if (!repairs || repairs.length === 0) {
    return (
      <p className="text-body-secondary text-center py-4 mb-0">
        Brak przypisanych napraw.
      </p>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover table-sm align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Produkt</th>
            <th scope="col">Zgłaszający</th>
            <th scope="col">Status</th>
            <th scope="col">Utworzono</th>
          </tr>
        </thead>

        <tbody>
          {repairs.map((repair) => (
            <tr key={repair.id}>
              <td>
                <Link to={`/repair/${repair.id}`}>#{repair.id}</Link>
              </td>

              <td>{repair.product}</td>

              <td>
                {repair.reporterName} {repair.reporterSurname}
              </td>

              <td>
                <StatusBadge status={repair.status} />
              </td>

              <td>{new Date(repair.createdAt).toLocaleDateString("pl-PL")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserRepairs;
