import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Users, TrendingUp, Bell, Unlock, CheckCircle2, Eye, Phone, Mail, X, Trash2, MapPin, Plus } from 'lucide-react';
import Button from '../components/Button';
import { useProperties } from '../context/PropertyContext';
import './BrokerDashboard.css';

const INITIAL_LEADS = [
  { id: 1, name: "Nishant Giri", type: "Buy/Rent", property: "3 BHK Arera Colony", budget: "1.5 Cr", status: "New", isUnlocked: false, phone: "+91 8602563817", email: "giri14nishant@gmail.com" },
  { id: 2, name: "Priya Mehta", type: "Rent", property: "2 BHK Kolar Road", budget: "25k/mo", status: "Hot", isUnlocked: false, phone: "+91 8765432109", email: "priya@email.com" },
  { id: 3, name: "Rahul Deshmukh", type: "Buy", property: "Villa Hoshangabad Rd", budget: "3 Cr", status: "Contacted", isUnlocked: true, phone: "+91 7654321098", email: "rahul@email.com" },
  { id: 4, name: "Anita Kapoor", type: "Buy", property: "Plot Bawadiya Kalan", budget: "80 Lacs", status: "New", isUnlocked: false, phone: "+91 6543210987", email: "anita@email.com" },
  { id: 5, name: "Suresh Patel", type: "Rent", property: "1 BHK Shamla Hills", budget: "15k/mo", status: "Hot", isUnlocked: false, phone: "+91 5432109876", email: "suresh@email.com" },
];

const BrokerDashboard = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [credits, setCredits] = useState(200);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'new', 'hot', 'contacted'
  const [activeTab, setActiveTab] = useState('leads'); // 'leads', 'properties'
  const { properties, deleteProperty } = useProperties();

  const handleUnlockLead = (leadId) => {
    if (credits < 50) {
      alert('Insufficient credits! Please buy more credits.');
      return;
    }
    setLeads(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, isUnlocked: true, status: 'Contacted' } : lead
    ));
    setCredits(prev => prev - 50);
  };

  const handleDeleteProperty = (id) => {
    if (window.confirm("Are you sure you want to delete this property listing?")) {
      deleteProperty(id);
    }
  };

  const unlockedCount = leads.filter(l => l.isUnlocked).length;
  const newLeadsCount = leads.filter(l => l.status === 'New').length;
  const hotLeadsCount = leads.filter(l => l.status === 'Hot').length;

  const filteredLeads = filter === 'all' ? leads : leads.filter(l => l.status.toLowerCase() === filter);

  const formatPropertyType = (type) => {
    if (!type) return "N/A";
    const types = {
      apartment: "Apartment",
      villa: "Villa / House",
      plot: "Plot",
      commercial: "Commercial"
    };
    return types[type.toLowerCase()] || type;
  };

  return (
    <div className="broker-dashboard container">
      <div className="dashboard-header">
        <div>
          <h1>Broker <span className="gradient-text">Dashboard</span></h1>
          <p className="text-secondary">Welcome back, Rahul Desai. You have <strong>{credits}</strong> credits remaining.</p>
        </div>
        <div className="header-actions">
          <div className="notification-wrapper">
            <Button variant="ghost" className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={20} />
              {newLeadsCount > 0 && <span className="notification-badge">{newLeadsCount}</span>}
            </Button>
            {showNotifications && (
              <div className="notification-dropdown glass-panel">
                <div className="notification-header">
                  <h4>Notifications</h4>
                  <button onClick={() => setShowNotifications(false)}><X size={16} /></button>
                </div>
                <div className="notification-item">
                  <span className="notif-dot new"></span>
                  <p>{newLeadsCount} new leads available for your area</p>
                </div>
                <div className="notification-item">
                  <span className="notif-dot hot"></span>
                  <p>{hotLeadsCount} hot leads need attention</p>
                </div>
                <div className="notification-item">
                  <span className="notif-dot"></span>
                  <p>Your monthly report is ready</p>
                </div>
              </div>
            )}
          </div>
          <Button variant="primary" onClick={() => setCredits(prev => prev + 100)}>Buy Credits (+100)</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon bg-primary-light">
            <IndianRupee size={24} className="text-primary" />
          </div>
          <div className="stat-content">
            <p className="text-secondary">Credits Balance</p>
            <h3>{credits}</h3>
            <span className="trend positive"><TrendingUp size={14} /> Available now</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon bg-secondary-light">
            <Users size={24} className="text-secondary" />
          </div>
          <div className="stat-content">
            <p className="text-secondary">Active Leads</p>
            <h3>{leads.length}</h3>
            <span className="trend positive"><TrendingUp size={14} /> +{newLeadsCount} new today</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon bg-accent-light">
            <CheckCircle2 size={24} className="text-accent" />
          </div>
          <div className="stat-content">
            <p className="text-secondary">Unlocked Leads</p>
            <h3>{unlockedCount}</h3>
            <span className="trend neutral">of {leads.length} total</span>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          💼 Lead Marketplace ({leads.length})
        </button>
        <button
          className={`dashboard-tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          🏠 My Listed Properties ({properties.length})
        </button>
      </div>

      {/* Conditionally render Leads Marketplace or My Listed Properties */}
      {activeTab === 'leads' ? (
        <div className="leads-section animate-fade-in">
          <div className="section-header">
            <h2>Lead Marketplace</h2>
            <div className="lead-filters">
              <button className={`lead-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({leads.length})</button>
              <button className={`lead-filter-btn ${filter === 'new' ? 'active' : ''}`} onClick={() => setFilter('new')}>New ({newLeadsCount})</button>
              <button className={`lead-filter-btn ${filter === 'hot' ? 'active' : ''}`} onClick={() => setFilter('hot')}>Hot ({hotLeadsCount})</button>
              <button className={`lead-filter-btn ${filter === 'contacted' ? 'active' : ''}`} onClick={() => setFilter('contacted')}>Contacted ({unlockedCount})</button>
            </div>
          </div>

          <div className="leads-table-container glass-panel">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Lead Info</th>
                  <th>Requirement</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className={lead.status === 'Hot' ? 'hot-row' : ''}>
                    <td>
                      <div className="lead-type-cell">
                        <span className={`type-badge ${lead.type.toLowerCase()}`}>{lead.type}</span>
                        <span className="lead-name">{lead.isUnlocked ? lead.name : "Contact Hidden"}</span>
                      </div>
                    </td>
                    <td>{lead.property}</td>
                    <td className="budget-cell">{lead.budget}</td>
                    <td><span className={`status-badge ${lead.status.toLowerCase()}`}>{lead.status}</span></td>
                    <td>
                      {lead.isUnlocked ? (
                        <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => setSelectedLead(lead)}>View Details</Button>
                      ) : (
                        <Button variant="primary" size="sm" icon={<Unlock size={14} />} onClick={() => handleUnlockLead(lead.id)}>Unlock (50 Credits)</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="leads-section animate-fade-in">
          <div className="section-header">
            <h2>My Listed Properties</h2>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => navigate('/add-property')}>Add Property</Button>
          </div>

          <div className="leads-table-container glass-panel">
            {properties.length > 0 ? (
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>Property Info</th>
                    <th>Property Type</th>
                    <th>Price / Budget</th>
                    <th>Size (Sq. Ft.)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map(property => (
                    <tr key={property.id}>
                      <td>
                        <div className="property-lead-cell" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img src={property.image} alt={property.title} style={{ width: '50px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                          <div>
                            <span className="lead-name" style={{ display: 'block' }}>{property.title}</span>
                            <span className="text-secondary" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={12} /> {property.location}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${(property.type || 'villa').toLowerCase()}`}>{formatPropertyType(property.type)}</span>
                      </td>
                      <td className="budget-cell">₹ {property.price}</td>
                      <td>{property.sqft || "N/A"} Sq Ft</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => navigate(`/property/${property.id}`)}>View Details</Button>
                          <Button variant="ghost" size="sm" className="text-danger" icon={<Trash2 size={14} />} onClick={() => handleDeleteProperty(property.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-results text-center" style={{ padding: '3rem' }}>
                <h3>No listed properties</h3>
                <p className="text-secondary mt-2">You haven't listed any properties yet.</p>
                <Button variant="primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/add-property')}>Add Property Now</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedLead(null)}>&times;</button>
            <h2>Lead Details</h2>
            <div className="lead-detail-grid">
              <div className="lead-detail-item">
                <span className="label">Name</span>
                <span className="value">{selectedLead.name}</span>
              </div>
              <div className="lead-detail-item">
                <span className="label">Type</span>
                <span className={`type-badge ${selectedLead.type.toLowerCase()}`}>{selectedLead.type}</span>
              </div>
              <div className="lead-detail-item">
                <span className="label">Requirement</span>
                <span className="value">{selectedLead.property}</span>
              </div>
              <div className="lead-detail-item">
                <span className="label">Budget</span>
                <span className="value">{selectedLead.budget}</span>
              </div>
              <div className="lead-detail-item full-width">
                <span className="label"><Phone size={16} /> Phone</span>
                <span className="value">{selectedLead.phone}</span>
              </div>
              <div className="lead-detail-item full-width">
                <span className="label"><Mail size={16} /> Email</span>
                <span className="value">{selectedLead.email}</span>
              </div>
            </div>
            <div className="lead-detail-actions">
              <Button variant="primary" fullWidth icon={<Phone size={16} />}>Call Now</Button>
              <Button variant="outline" fullWidth icon={<Mail size={16} />}>Send Email</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerDashboard;
