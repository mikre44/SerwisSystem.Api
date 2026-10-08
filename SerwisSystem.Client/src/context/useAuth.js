import { useContext } from "react";
import { AuthContext } from "./authState";
export function useAuth() { return useContext(AuthContext); }
