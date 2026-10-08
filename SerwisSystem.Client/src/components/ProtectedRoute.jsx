import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function ProtectedRoute() {
  const { user } = useAuth();

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;