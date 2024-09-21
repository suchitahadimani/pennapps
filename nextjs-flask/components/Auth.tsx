// context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { usePropelAuth } from 'propel-auth';


// Define the type for the Auth state
interface AuthState {
  user: any; // Adjust this type based on your user structure
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthState | null>(null); // Set initial value to null

export const AuthProvider = ({ children }) => {
  const { user, isAuthenticated, loading } = usePropelAuth();
  const [authState, setAuthState] = useState<AuthState | null>(null);

  useEffect(() => {
    setAuthState({ user, isAuthenticated, loading });
  }, [user, isAuthenticated, loading]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
