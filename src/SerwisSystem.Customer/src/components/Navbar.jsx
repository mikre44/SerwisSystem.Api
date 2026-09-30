import { NavLink } from "react-router-dom";

function navLinkClass({ isActive }) {
  return `nav-link${isActive ? " active" : ""}`;
}

function Navbar() {
  return (
    <nav className="navbar navbar-expand navbar-dark bg-primary mb-4">
      {/* flex-wrap: on a phone the links move under the brand instead of
          being squeezed into two-line labels. */}
      <div className="container flex-wrap">
        <span className="navbar-brand mb-0 h1">SerwisSystem</span>

        <div className="navbar-nav">
          <NavLink to="/" end className={navLinkClass}>
            Zgłoś naprawę
          </NavLink>
          <NavLink to="/check" className={navLinkClass}>
            Sprawdź status
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
