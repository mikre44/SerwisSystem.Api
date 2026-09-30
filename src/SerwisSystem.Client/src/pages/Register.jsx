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

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await register(username, email, password);

      navigate("/login");
    } catch (error) {
      setError(error.message);
      setFieldErrors(error.fieldErrors ?? {});
    }
  }

  return (
    <div>
      <h1>Register</h1>

      <Message error={error} />

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="register-username">Username</label>
          <input
            id="register-username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <FieldError messages={fieldErrors.username} />
        </div>

        <div>
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FieldError messages={fieldErrors.email} />
        </div>

        <div>
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FieldError messages={fieldErrors.password} />
        </div>

        <button type="submit">
          Register
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;
