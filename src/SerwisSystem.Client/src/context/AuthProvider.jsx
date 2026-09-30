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

    // A token that cannot load the user is useless (expired, or the account
    // was deleted), so it is dropped instead of being sent with every request.
    getLoggedUser()
      .then(setUser)
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function reloadUser() {
    setUser(await getLoggedUser());
  }

  async function signIn(usernameOrEmail, password) {
    const { token } = await login(usernameOrEmail, password);

    saveToken(token);

    try {
      await reloadUser();
    } catch (error) {
      // Same as above: do not keep a token we could not use.
      clearToken();
      throw error;
    }
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
