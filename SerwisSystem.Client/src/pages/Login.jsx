import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { login } from "../api/api";
import { Link } from "react-router-dom";

function Login() {
  const { reloadUser } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;
    setSubmitting(true); setError("");
    try {
      const data = await login(usernameOrEmail, password);

      localStorage.setItem("token", data.token);

      await reloadUser();



    } catch (error) {
      setError(error.message);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="auth-card">
      <p className="eyebrow">Panel pracownika</p>
      <h1>Zaloguj się</h1>

      {error && <p role="alert">{error}</p>}
      <p className="page-intro">Zaloguj się, aby zarządzać zgłoszeniami serwisowymi.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="login-username">Nazwa użytkownika lub e-mail</label>
        <input
          id="login-username"
          autoComplete="username"
          type="text"
          placeholder="Nazwa użytkownika lub e-mail"
          value={usernameOrEmail}
          onChange={(event) =>
            setUsernameOrEmail(event.target.value)
          }
        />

        <label htmlFor="login-password">Hasło</label>
        <input id="login-password" autoComplete="current-password" type="password"
          placeholder="Hasło"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
        />

        <button type="submit" disabled={submitting}>
          Zaloguj się
        </button>
      </form>
        <p>
          Nie masz konta?{" "}
          <Link to="/register">Zarejestruj się</Link>
        </p>
    </div>
  );
}

export default Login;