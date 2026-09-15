import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav>
      <Link to="/"> Home </Link>{" | "}
            
      {(user.role === "Admin" || user.permissions?.readUsers) && (
        <Link to="/users"> Users </Link>
      )}
      {(user.role === "Admin" || user.permissions?.readRepairs) && (
        <Link to="/repairs"> Repairs </Link>
      )}
      
      <Link to="/user"> Your profile </Link>{" | "}

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