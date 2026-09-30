import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  Admin: "Administrator",
  Worker: "Pracownik",
};

function navLinkClass({ isActive }) {
  return `nav-link${isActive ? " active" : ""}`;
}

function Navbar() {
  const { user, logout } = useAuth();
  // Bootstrap's collapse component needs its JS bundle for this; we don't
  // load it, so the show/hide state is plain React state instead.
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar navbar-expand-lg bg-dark mb-4" data-bs-theme="dark">
      <div className="container">
        <NavLink to="/" className="navbar-brand d-flex align-items-center gap-2" onClick={closeMenu}>
          <i className="bi bi-tools" aria-hidden="true" />
          SerwisSystem
        </NavLink>

        <button
          type="button"
          className="navbar-toggler"
          aria-expanded={menuOpen}
          aria-label="Przełącz nawigację"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse${menuOpen ? " show" : ""}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {(user.role === "Admin" || user.permissions?.readRepairs) && (
              <li className="nav-item">
                <NavLink to="/repairs" className={navLinkClass} onClick={closeMenu}>
                  Naprawy
                </NavLink>
              </li>
            )}

            {(user.role === "Admin" || user.permissions?.readUsers) && (
              <li className="nav-item">
                <NavLink to="/users" className={navLinkClass} onClick={closeMenu}>
                  Użytkownicy
                </NavLink>
              </li>
            )}

            {user.role === "Admin" && (
              <li className="nav-item">
                <NavLink to="/admins" className={navLinkClass} onClick={closeMenu}>
                  Administratorzy
                </NavLink>
              </li>
            )}
          </ul>

          <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 gap-lg-3 pb-2 pb-lg-0">
            <span className="text-light d-flex align-items-center gap-2">
              {user.username}
              <span className={`badge ${user.role === "Admin" ? "text-bg-danger" : "text-bg-secondary"}`}>
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </span>

            {/* `end`: only "/user" itself is "my account", not other users' "/user/:id" pages. */}
            <NavLink to="/user" end className="btn btn-outline-light btn-sm" onClick={closeMenu}>
              Moje konto
            </NavLink>

            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              onClick={() => {
                closeMenu();
                logout();
              }}
            >
              Wyloguj
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
