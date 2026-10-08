import { useCallback, useEffect, useState } from "react";
import { getLoggedUser } from "../api/api";
import { AuthContext } from "./authState";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));
  const [error, setError] = useState("");
  const logout = useCallback(() => { localStorage.removeItem("token"); setUser(null); setError(""); }, []);
  const reloadUser = useCallback(async () => {
    const account = await getLoggedUser();
    setUser(account); setError(""); setLoading(false);
    return account;
  }, []);
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    const requestController = new AbortController();
    getLoggedUser(requestController.signal).then(account => {
      if (!requestController.signal.aborted) { setUser(account); setError(""); }
    }).catch(error => {
      if (!requestController.signal.aborted) setError(error.message);
    }).finally(() => {
      if (!requestController.signal.aborted) setLoading(false);
    });
    return () => requestController.abort();
  }, []);
  return <AuthContext.Provider value={{ user, loading, error, logout, reloadUser }}>{children}</AuthContext.Provider>;
}
