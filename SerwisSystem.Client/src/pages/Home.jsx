import { useAuth } from "../context/AuthContext";

function Home() {
  const { user, logout } = useAuth();

  if (!user) {
    return <p>Not logged in.</p>;
  }

  return (
    <div>
      <h1>SerwisSystem</h1>

      <p>Welcome, {user.username}!</p>
      <p>Role: {user.role}</p>

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
}

export default Home;