import { useState } from "react";
import { getLoggedUser, login } from "../api/api";

function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

   try {
      const data = await login(usernameOrEmail, password);

      localStorage.setItem("token", data.token);

      console.log("Login successful!");

      const user = await getLoggedUser();

      console.log("Logged user:", user);

    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username or email"
          value={usernameOrEmail}
          onChange={(event) =>
            setUsernameOrEmail(event.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
        />

        <button type="submit">
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;