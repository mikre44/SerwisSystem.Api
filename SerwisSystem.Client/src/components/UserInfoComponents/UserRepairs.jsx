function UserRepairs({ repairs }) {
  if (!repairs || repairs.length === 0) {
    return (
      <div>
        <h2>Taken repairs</h2>
        <p>No repairs assigned.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Taken repairs</h2>

      {repairs.map((repair) => (
        <div key={repair.id}>
          <hr />

          <p>ID: {repair.id}</p>
          <p>Serial number: {repair.serialNumber}</p>
          <p>Product: {repair.product}</p>
          <p>Description: {repair.description}</p>
          <p>Status: {repair.status}</p>
          <p>Created: {repair.createdAt}</p>
        </div>
      ))}
    </div>
  );
}

export default UserRepairs;