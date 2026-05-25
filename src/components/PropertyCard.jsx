import { useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart } from 'lucide-react';
import Button from './Button';
import './PropertyCard.css';

const PropertyCard = ({ property }) => {
  const navigate = useNavigate();

  return (
    <div className="property-card glass-panel" style={{ cursor: 'pointer' }} onClick={() => navigate(`/property/${property.id}`)}>
      <div className="property-image-container">
        <img src={property.image} alt={property.title} className="property-image" />
        <div className="property-badges" style={{ display: 'flex', gap: '0.5rem', width: 'calc(100% - 2rem)', flexWrap: 'wrap' }}>
          {property.isAiMatch && (
            <span className="badge-ai gradient-bg" style={{ pointerEvents: 'none' }}>AI Match {property.matchScore}%</span>
          )}
          {property.videoUrl && (
            <span 
              className="badge-video glass-panel" 
              style={{ 
                background: 'rgba(239, 68, 68, 0.25)', 
                backdropFilter: 'blur(8px)',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#ff4d4d', 
                border: '1px solid rgba(239, 68, 68, 0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                window.open(property.videoUrl, '_blank', 'noopener,noreferrer');
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)';
                e.currentTarget.style.borderColor = '#ff4d4d';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
              title="Watch video tour"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Video Tour
            </span>
          )}
          <button className="like-btn glass-panel" style={{ marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <Heart size={18} className={property.isLiked ? 'liked' : ''} />
          </button>
        </div>
      </div>
      
      <div className="property-details">
        <div className="property-price">₹ {property.price}</div>
        <h3 className="property-title">{property.title}</h3>
        <div className="property-location">
          <MapPin size={16} />
          <span>{property.location}</span>
        </div>
        
        <div className="property-features">
          <div className="feature">
            <Bed size={18} />
            <span>{property.beds} Beds</span>
          </div>
          <div className="feature">
            <Bath size={18} />
            <span>{property.baths} Baths</span>
          </div>
          <div className="feature">
            <Square size={18} />
            <span>{property.sqft} sqft</span>
          </div>
        </div>
        
        <div className="property-footer" onClick={(e) => e.stopPropagation()}>
          {property.videoUrl ? (
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <Button 
                variant="outline" 
                size="sm" 
                style={{ flex: 1 }} 
                onClick={() => navigate(`/property/${property.id}`)}
              >
                View Details
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                style={{ 
                  flex: 1, 
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)', 
                  borderColor: '#ef4444',
                  boxShadow: '0 4px 10px rgba(239, 68, 68, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }} 
                onClick={() => window.open(property.videoUrl, '_blank', 'noopener,noreferrer')}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Watch Video
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" fullWidth onClick={() => navigate(`/property/${property.id}`)}>View Details</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
