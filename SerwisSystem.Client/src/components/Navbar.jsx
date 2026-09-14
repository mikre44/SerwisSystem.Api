import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav>
      <Link to="/">Home</Link>{" | "}
      
      <Link to="/repairs">Repairs</Link>{" | "}
      
      <Link to="/users">Users</Link>{" | "}
      
      <Link to="/repairs">Repairs</Link>{" | "}
      
      <Link to="/user">My profile</Link>{" | "}

      <button onClick={logout}>
        Logout
      </button>
      
      <p>
        Logged in as: {user.username}
      </p>
    </nav>
    );
}

export default Navbar;