import { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('admin-authenticated') === 'true');
  const navigate = useNavigate();

  const login = (username, password) => {
    const validUsername = 'un-14nishantgiri';
    const validPassword = 'nishANT@7';
    if (username === validUsername && password === validPassword) {
      sessionStorage.setItem('admin-authenticated', 'true');
      setIsAuthenticated(true);
      navigate('/admin-dashboard');
    } else {
      alert('Invalid credentials');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('admin-authenticated');
    setIsAuthenticated(false);
    navigate('/admin-login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

