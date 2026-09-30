import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user } = useAuth();

  const isAdmin = user.role === "Admin";
  const canReadRepairs = isAdmin || user.permissions?.readRepairs;
  const canReadUsers = isAdmin || user.permissions?.readUsers;
  const hasNoPermissions = !isAdmin && !user.permissions?.readRepairs && !user.permissions?.readUsers;

  // Cards for the sections the logged-in user is actually allowed to open.
  const sections = [
    canReadRepairs && {
      to: "/repairs",
      icon: "bi-wrench-adjustable",
      title: "Naprawy",
      description: "Przeglądaj i obsługuj zgłoszenia napraw.",
    },
    canReadUsers && {
      to: "/users",
      icon: "bi-people",
      title: "Użytkownicy",
      description: "Zarządzaj kontami i uprawnieniami pracowników.",
    },
    isAdmin && {
      to: "/admins",
      icon: "bi-shield-lock",
      title: "Administratorzy",
      description: "Zarządzaj kontami administratorów.",
    },
    {
      to: "/user",
      icon: "bi-person-circle",
      title: "Moje konto",
      description: "Zobacz swój profil i zmień hasło.",
    },
  ].filter(Boolean);

  return (
    <main className="container py-4">
      <div className="mb-4">
        <h1 className="h3 mb-1">Witaj, {user.username}!</h1>
        <p className="text-body-secondary mb-0 d-flex align-items-center gap-2">
          Zalogowano jako
          <span className={`badge ${isAdmin ? "text-bg-danger" : "text-bg-secondary"}`}>
            {isAdmin ? "Administrator" : "Pracownik"}
          </span>
        </p>
      </div>

      {hasNoPermissions && (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          <span>
            Twoje konto nie ma jeszcze żadnych uprawnień. Administrator musi je przyznać.
          </span>
        </div>
      )}

      <div className="row g-3">
        {sections.map((section) => (
          <div className="col-sm-6 col-lg-4" key={section.to}>
            <Link to={section.to} className="text-decoration-none">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <i className={`bi ${section.icon} fs-2 text-primary`} aria-hidden="true" />
                  <h2 className="h5 card-title mt-2">{section.title}</h2>
                  <p className="card-text text-body-secondary mb-0">{section.description}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}

export default Home;
