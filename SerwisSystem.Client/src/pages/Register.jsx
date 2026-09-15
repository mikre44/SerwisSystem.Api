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
      <h1>Register</h1>

      {error && <p>Error: {error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Username: </label>

          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div>
          <label>Email: </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div>
          <label>Password: </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button type="submit">
          Register
        </button>
      </form>

      <p>
        Already have an account?{" "}
        <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;