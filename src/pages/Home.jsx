import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import PropertyCard from '../components/PropertyCard';
import { useProperties } from '../context/PropertyContext';
import './Home.css';

const Home = () => {
  const { properties } = useProperties();
  const navigate = useNavigate();

  // Show only 3 items that have a high AI match score, are approved, and are not sold
  const recommendedProperties = properties
    .filter(p => p.isApproved && !p.isSold && (p.matchScore >= 90 || p.isAiMatch))
    .slice(0, 3);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-content animate-fade-in">
          <div className="hero-text">
            <span className="badge glass-panel"><Sparkles size={16} className="text-accent" /> AI-Powered Real Estate</span>
            <h1>Sell or Rent your Property in <span className="gradient-text">Bhopal</span></h1>
            <p className="hero-subtitle">
              Easy Rent, Quick Sell — Bhopal Property Deals Ab Smart & Fast!
            </p>
            <Button variant="primary" className="explore-btn" onClick={() => navigate('/properties')}>Explore Properties</Button>
    

          </div>

          <div className="hero-visual">
            <div className="glass-panel property-showcase">
              {/* Placeholder for 3D/modern visual */}
              <div className="showcase-image-placeholder gradient-bg">
                <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Modern Home" className="showcase-img" />
              </div>
              <div className="floating-card price-tag glass-panel">
                <span className="label">Premium Villa</span>
                <span className="price">₹ 1.2 Cr</span>
              </div>
              <div className="floating-card ai-badge glass-panel">
                <Sparkles size={16} className="text-accent" />
                <span>98% Match</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Recommended Section */}
      <section className="section recommended-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">AI <span className="gradient-text">Recommended</span> for You</h2>
              <p className="section-subtitle">Based on your recent searches in Bhopal</p>
            </div>
            <Button variant="ghost" className="view-all-btn">View All <ArrowRight size={16} /></Button>
          </div>

          <div className="properties-grid">
            {recommendedProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
