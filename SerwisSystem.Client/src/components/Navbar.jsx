import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav>
      <Link to="/"> Strona główna </Link>{" | "}

      {(user.role === "Admin" || user.permissions?.readUsers) && (
        <><Link to="/users"> Użytkownicy </Link>{" | "}</>
      )}

      {(user.role === "Admin" || user.permissions?.readRepairs) && (
        <><Link to="/repairs"> Naprawy </Link>{" | "}</>
      )}

      {user.role === "Admin" && (
        <><Link to="/admins">Administratorzy</Link>{" | "}</>
      )}

      <Link to="/user"> Twój profil </Link>{" | "}

      <button onClick={logout}>
        Wyloguj się
      </button>

      <p>
        Zalogowano jako: {user.username}
      </p>
    </nav>
    );
}

export default Navbar;