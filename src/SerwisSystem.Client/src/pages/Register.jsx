import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/api";
import FieldError from "../components/FieldError";
import Message from "../components/Message";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setFieldErrors({});
    setSubmitting(true);

    try {
      await register(username, email, password);

      navigate("/login");
    } catch (error) {
      setError(error.message);
      setFieldErrors(error.fieldErrors ?? {});
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
            <h2 className="h5 card-title mb-3">Rejestracja</h2>

            <Message error={error} />

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="register-username" className="form-label">
                  Nazwa użytkownika
                </label>
                <input
                  id="register-username"
                  type="text"
                  className={`form-control${fieldErrors.username ? " is-invalid" : ""}`}
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
                <FieldError messages={fieldErrors.username} />
              </div>

              <div className="mb-3">
                <label htmlFor="register-email" className="form-label">
                  E-mail
                </label>
                <input
                  id="register-email"
                  type="email"
                  className={`form-control${fieldErrors.email ? " is-invalid" : ""}`}
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <FieldError messages={fieldErrors.email} />
              </div>

              <div className="mb-3">
                <label htmlFor="register-password" className="form-label">
                  Hasło
                </label>
                <input
                  id="register-password"
                  type="password"
                  className={`form-control${fieldErrors.password ? " is-invalid" : ""}`}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <FieldError messages={fieldErrors.password} />
              </div>

              <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                {submitting && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                )}
                Zarejestruj się
              </button>
            </form>

            <p className="text-center mt-3 mb-0">
              Masz już konto? <Link to="/login">Zaloguj się</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
