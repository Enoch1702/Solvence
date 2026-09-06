import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'solvence_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  // Hydrate user profile on mount if token exists
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const userProfile = await api.getCurrentUser();
        if (isMounted) {
          setUser(userProfile);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn('Authentication token invalid or expired. Logging out.', err);
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    // Listen for unauthorized 401 events from the api interceptor
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('solvence:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('solvence:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.login({ email, password });
      if (res && res.token) {
        localStorage.setItem(TOKEN_KEY, res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
      }
      throw new Error('Authentication did not return a valid token.');
    } catch (err) {
      setError(err.message || 'Failed to sign in.');
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await api.register({ name, email, password });
      if (res && res.token) {
        localStorage.setItem(TOKEN_KEY, res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
      }
      throw new Error('Registration did not return a valid token.');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
