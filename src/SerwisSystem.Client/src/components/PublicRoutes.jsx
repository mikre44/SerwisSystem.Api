import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PublicRoute() {
  const { user } = useAuth();
  
  return user ? <Navigate to="/" replace /> : <Outlet />;
}

export default PublicRoute;