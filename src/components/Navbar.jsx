import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Menu, X, User, LogOut } from 'lucide-react';
import Button from './Button';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    navigate('/admin-login');
  };

  return (
    <header className="navbar-container glass-panel">
      <div className="navbar container">
        <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
          <Building2 size={28} className="logo-icon" />
          <span className="logo-text">Bhopal<span className="gradient-text">Estates</span></span>
        </Link>

        <nav className={`navbar-links ${isOpen ? 'active' : ''}`}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'nav-active' : ''}`} onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/properties" className={`nav-link ${isActive('/properties') || isActive('/property') ? 'nav-active' : ''}`} onClick={() => setIsOpen(false)}>Properties</Link>
          <Link to="/ai-match" className={`nav-link ${isActive('/ai-match') ? 'nav-active' : ''}`} onClick={() => setIsOpen(false)}>AI Match</Link>
          {isAuthenticated && (
            <Link to="/admin-dashboard" className={`nav-link ${isActive('/admin-dashboard') ? 'nav-active' : ''}`} onClick={() => setIsOpen(false)}>Admin Dashboard</Link>
          )}
          {/* <Link to="/pricing" className={`nav-link ${isActive('/pricing') ? 'nav-active' : ''}`} onClick={() => setIsOpen(false)}>Pricing</Link> */}
          
          <div className="mobile-actions">
            {isAuthenticated ? (
              <Button variant="ghost" className="login-btn" icon={<LogOut size={18} />} onClick={() => { setIsOpen(false); logout(); }}>Logout</Button>
            ) : (
              <Button variant="ghost" className="login-btn" icon={<User size={18} />} onClick={handleLoginClick}>Login</Button>
            )}
            <Button variant="primary" onClick={() => { setIsOpen(false); navigate('/add-property'); }}>Add Property</Button>
          </div>
        </nav>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link to="/admin-dashboard" className={`nav-link ${isActive('/admin-dashboard') ? 'nav-active' : ''}`} style={{ marginRight: '1rem' }}>Admin</Link>
              <Button variant="ghost" icon={<LogOut size={18} />} className="login-btn" onClick={logout}>Logout</Button>
            </>
          ) : (
            <Button variant="ghost" icon={<User size={18} />} className="login-btn" onClick={handleLoginClick}>Login</Button>
          )}
          <Button variant="primary" onClick={() => navigate('/add-property')}>Add Property</Button>
        </div>

        <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
