import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
      <div className="app-shell staff-app">

      {user ? <Navbar /> : <header className="site-header"><a className="brand" href="/">Mentor<span>Serwis</span><small>Panel pracownika</small></a></header>}
      <main className="app-content">

      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={user?.role === "Admin" || user?.permissions?.readRepairs ? <Navigate to="/repairs" replace /> : <Home />} />

          <Route path="/repairs" element={<Repairs />} />
          <Route path="/repair/:id" element={<Repair />} />

          <Route path="/users" element={<Users />} />
          <Route path="/user" element={<LoggedUser />} />
          <Route path="/user/:id" element={<User/>} />

          <Route path="/admins" element={<Admins />} />
        </Route>

      </Routes>
      </main>
      <footer className="site-footer">SerwisSystem <span>Panel pracownika</span></footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
