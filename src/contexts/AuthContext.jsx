import { createContext, useContext, useState, useCallback } from "react";
import { getProfile, saveProfile, clearProfile, registerAccount, loginAccount } from "../lib/userStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(() => getProfile());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const user = profile ? { id: profile.nickname, email: profile.nickname } : null;

  const register = useCallback(async (nickname, password) => {
    setLoading(true);
    setError(null);
    try {
      await registerAccount(nickname, password);
      const p = saveProfile({ nickname, password });
      setProfile(p);
      return p;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (nickname, password) => {
    setLoading(true);
    setError(null);
    try {
      await loginAccount(nickname, password);
      const p = saveProfile({ nickname, password });
      setProfile(p);
      return p;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    clearProfile();
    setProfile(null);
    setError(null);
  }, []);

  const value = {
    user,
    profile,
    loading,
    error,
    clearError: () => setError(null),
    signInWithEmail: null,
    signUpWithEmail: null,
    signInWithWeChat: null,
    signOut,
    register,
    login,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
