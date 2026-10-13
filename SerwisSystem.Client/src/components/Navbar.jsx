import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <a className="brand" href="/">Mentor<span>Serwis</span><small>Panel pracownika</small></a>
      <nav aria-label="Nawigacja pracownika">
      {user.role !== "Admin" && !user.permissions?.readRepairs && <NavLink to="/" end>Panel</NavLink>}

      {(user.role === "Admin" || user.permissions?.readUsers) && (
        <><NavLink to="/users"> Użytkownicy </NavLink></>
      )}

      {(user.role === "Admin" || user.permissions?.readRepairs) && (
        <><NavLink to="/repairs"> Naprawy </NavLink></>
      )}

      {user.role === "Admin" && (
        <><NavLink to="/admins">Administratorzy</NavLink></>
      )}

      <NavLink to="/user" end> Twój profil </NavLink>

      </nav>
      <div className="account-menu">
      <button className="button-secondary" onClick={logout}>
        Wyloguj się
      </button>

      <p>
        Zalogowano jako: {user.username}
      </p>
      </div>
    </header>
    );
}

export default Navbar;
