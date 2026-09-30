import { useEffect, useState } from "react";
import { getLoggedUser, login } from "../api/api";
import { clearToken, getToken, saveToken } from "../api/auth";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Without a token there is nobody to load, so the app can render at once.
  const [loading, setLoading] = useState(() => getToken() !== null);

  useEffect(() => {
    if (!getToken()) {
      return;
    }

    getLoggedUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function reloadUser() {
    setUser(await getLoggedUser());
  }

  async function signIn(usernameOrEmail, password) {
    const { token } = await login(usernameOrEmail, password);

    saveToken(token);
    await reloadUser();
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
}
