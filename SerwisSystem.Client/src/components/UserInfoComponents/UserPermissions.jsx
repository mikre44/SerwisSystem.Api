function UserPermissions({ permissions, isAdmin = false }) {
  if (isAdmin) return <section><h2>Uprawnienia</h2><p>Administratorzy mają wszystkie uprawnienia.</p></section>;
  if (!permissions) {
    return <p>Brak uprawnień.</p>;
  }

  return (
    <div>
      <h2>Uprawnienia</h2>

      <p>Przeglądanie napraw: {permissions.readRepairs ? "Tak" : "Nie"}</p>
      <p>Przyjmowanie napraw: {permissions.takeRepairs ? "Tak" : "Nie"}</p>
      <p>Edycja napraw: {permissions.editRepairs ? "Tak" : "Nie"}</p>
      <p>Usuwanie napraw: {permissions.deleteRepairs ? "Tak" : "Nie"}</p>

      <p>Przeglądanie użytkowników: {permissions.readUsers ? "Tak" : "Nie"}</p>
      <p>Edycja użytkowników: {permissions.editUsers ? "Tak" : "Nie"}</p>
      <p>Usuwanie użytkowników: {permissions.deleteUsers ? "Tak" : "Nie"}</p>
      <p>Nadawanie uprawnień: {permissions.grantUsers ? "Tak" : "Nie"}</p>
      <p>
        Odłączanie pracowników od napraw: {permissions.dischargeUsers ? "Tak" : "Nie"}
      </p>
    </div>
  );
}

export default UserPermissions;