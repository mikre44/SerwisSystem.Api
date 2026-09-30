// Read-only summary of a user's core data. Headless (no card of its own) so it
// can be dropped into any card body — the user detail page and the logged-in
// user's own profile page both use it this way.
function UserInfo({ user }) {
  const isAdmin = user.role === "Admin";

  return (
    <dl className="row mb-0">
      <dt className="col-5">ID</dt>
      <dd className="col-7">{user.id}</dd>

      <dt className="col-5">Nazwa użytkownika</dt>
      <dd className="col-7">{user.username}</dd>

      <dt className="col-5">E-mail</dt>
      <dd className="col-7 text-break">{user.email}</dd>

      <dt className="col-5">Rola</dt>
      <dd className="col-7">
        <span className={`badge ${isAdmin ? "text-bg-dark" : "text-bg-light border"}`}>
          {isAdmin ? "Administrator" : "Pracownik"}
        </span>
      </dd>

      {isAdmin && (
        <>
          <dt className="col-5">Priorytet</dt>
          <dd className="col-7 mb-0">{user.priority}</dd>
        </>
      )}
    </dl>
  );
}

export default UserInfo;
