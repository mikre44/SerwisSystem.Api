import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/api";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await register(username, email, password);

      setError("");

      navigate("/login");
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div>
      <h1>Zarejestruj się</h1>

      {error && <p>Błąd: {error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="register-1">Nazwa użytkownika: </label>

          <input id="register-1"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="register-2">E-mail: </label>

          <input id="register-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="register-3">Hasło: </label>

          <input id="register-3"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button type="submit">
          Zarejestruj się
        </button>
      </form>

      <p>
        Masz już konto?{" "}
        <Link to="/login">Zaloguj się</Link>
      </p>
    </div>
  );
}

export default Register;