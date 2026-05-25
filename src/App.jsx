import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PropertyProvider } from './context/PropertyContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PropertyListing from './pages/PropertyListing';
import PropertyDetail from './pages/PropertyDetail';
import AIMatch from './pages/AIMatch';
import Pricing from './pages/Pricing';
import AddProperty from './pages/AddProperty';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// Component to protect admin routes
const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/admin-login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <PropertyProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/properties" element={<PropertyListing />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/ai-match" element={<AIMatch />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/add-property" element={<AddProperty />} />
                <Route
                  path="/admin-dashboard"
                  element={
                    <RequireAuth>
                      <AdminDashboard />
                    </RequireAuth>
                  }
                />
              </Routes>
            </main>
          </div>
        </PropertyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
