import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./context/useAuth";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Repairs from "./pages/Repairs";
import Users from "./pages/Users";
import LoggedUser from "./pages/LoggedUser";
import User from "./pages/User";
import Repair from "./pages/Repair";
import Admins from "./pages/Admins";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoutes";
import Navbar from "./components/Navbar";

function App() {
  const { loading, user, error } = useAuth();

  if (loading) {
    return <p>Wczytywanie...</p>;
  }

  if (error && !user) return <main><p role="alert">{error}</p><button onClick={() => window.location.reload()}>Ponów połączenie</button></main>;

  return (
    <BrowserRouter>

      {user && <Navbar />}

      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />

          <Route path="/repairs" element={<Repairs />} />
          <Route path="/repair/:id" element={<Repair />} />

          <Route path="/users" element={<Users />} />
          <Route path="/user" element={<LoggedUser />} />
          <Route path="/user/:id" element={<User/>} />

          <Route path="/admins" element={<Admins />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;