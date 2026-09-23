import { Link } from "react-router-dom";

function UserRepairs({ repairs }) {
  if (!repairs || repairs.length === 0) {
    return (
      <div>
        <h2>Repairs</h2>
        <p>No repairs assigned.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Repairs</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Serial number</th>
            <th>Product</th>
            <th>Reporter</th>
            <th>Address</th>
            <th>Status</th>
            <th>Created</th>
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
                {repair.status}
              </td>

              <td>
                {new Date(
                  repair.createdAt
                ).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserRepairs;