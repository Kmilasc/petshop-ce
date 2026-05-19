import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "customer" | "admin";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface Address {
  zipCode: string; street: string; number: string;
  complement?: string; neighborhood: string; city: string; state: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, cpf: string, phone?: string, address?: Address) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("petshop_token");
    if (token) {
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => {
          if (!r.ok) {
            localStorage.removeItem("petshop_token");
            setState({ user: null, token: null, isLoading: false });
            return;
          }
          return r.json().then((data) => {
            if (data.user) {
              setState({ user: data.user, token, isLoading: false });
            } else {
              localStorage.removeItem("petshop_token");
              setState({ user: null, token: null, isLoading: false });
            }
          });
        })
        .catch(() => setState({ user: null, token: null, isLoading: false }));
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao fazer login");
    localStorage.setItem("petshop_token", data.token);
    setState({ user: data.user, token: data.token, isLoading: false });
  };

  const register = async (name: string, email: string, password: string, cpf: string, phone?: string, address?: Address) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, cpf, phone, address }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao registrar");
    localStorage.setItem("petshop_token", data.token);
    setState({ user: data.user, token: data.token, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem("petshop_token");
    setState({ user: null, token: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
