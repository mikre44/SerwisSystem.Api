import { useAuth } from "../context/AuthContext";


function Home() {
  const { user } = useAuth();

  return  (
    <div>
      <h1>SerwisSystem</h1>

      <p>Welcome, {user.username}!</p>
      <p>Role: {user.role}</p>

      {user.role !== "Admin" &&
        !user.permissions?.readRepairs &&
        !user.permissions?.readUsers && (
          <p>
            Your account does not have any permissions yet.
            An administrator must grant them.
          </p>
        )}
    </div>
  );
}

export default Home;