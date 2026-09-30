import { createContext, useContext } from "react";

// Kept apart from AuthProvider.jsx: a file that exports a React component
// should export only components, otherwise Vite's fast refresh stops working.
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}
