import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Message from "../components/Message";

function Login() {
  const { signIn } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      // On success the user is set and PublicRoute redirects to the home page.
      await signIn(usernameOrEmail, password);
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container min-vh-100 d-flex align-items-center">
      <div className="col-sm-10 col-md-7 col-lg-5 mx-auto">
        <div className="text-center mb-4">
          <i className="bi bi-tools display-4 text-primary" aria-hidden="true" />
          <h1 className="h3 mt-2 mb-0">SerwisSystem</h1>
          <p className="text-body-secondary">Panel serwisu</p>
        </div>

        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h2 className="h5 card-title mb-3">Logowanie</h2>

            <Message error={error} />

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="login-username" className="form-label">
                  Nazwa użytkownika lub e-mail
                </label>
                <input
                  id="login-username"
                  type="text"
                  className="form-control"
                  autoComplete="username"
                  required
                  value={usernameOrEmail}
                  onChange={(event) => setUsernameOrEmail(event.target.value)}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="login-password" className="form-label">
                  Hasło
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="form-control"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                {submitting && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                )}
                Zaloguj się
              </button>
            </form>

            <p className="text-center mt-3 mb-0">
              Nie masz konta? <Link to="/register">Zarejestruj się</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
