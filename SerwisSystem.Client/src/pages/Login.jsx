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
    <div>
      <h1>Zaloguj się</h1>

      {error && <p role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nazwa użytkownika lub e-mail"
          value={usernameOrEmail}
          onChange={(event) =>
            setUsernameOrEmail(event.target.value)
          }
        />

        <input
          type="password"
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