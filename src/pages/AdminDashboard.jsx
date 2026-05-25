import { useEffect, useState } from 'react';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { X, Plus, Trash2, Edit2, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { properties, loading, error, deleteProperty, updateProperty, refetch } = useProperties();
  const { logout } = useAuth();
  
  const [editingProperty, setEditingProperty] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [newAmenity, setNewAmenity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Statistics
  const totalListings = properties.length;
  const soldListings = properties.filter(p => p.isSold).length;
  const pendingApproval = properties.filter(p => !p.isApproved).length;
  const availableListings = properties.filter(p => p.isApproved && !p.isSold).length;
  
  // Handlers for starting/cancelling edit
  const startEdit = (property) => {
    setEditingProperty(property);
    setEditFormData({
      ...property,
      amenities: property.amenities ? [...property.amenities] : []
    });
  };

  const cancelEdit = () => {
    setEditingProperty(null);
    setEditFormData({});
    setNewAmenity('');
  };

  // Form value change handler
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Save the property edits
  const handleSave = (e) => {
    e.preventDefault();
    if (!editFormData.title || !editFormData.location) {
      alert('Please fill out all required fields.');
      return;
    }
    
    // Auto-calculate priceNumeric if they changed expected price to numeric
    let numeric = editFormData.priceNumeric;
    if (editFormData.price && !isNaN(editFormData.price.replace(/[^0-9.]/g, ''))) {
      const plainNum = parseFloat(editFormData.price.replace(/[^0-9.]/g, ''));
      if (editFormData.price.toLowerCase().includes('cr')) {
        numeric = plainNum * 100;
      } else if (editFormData.price.toLowerCase().includes('lacs') || editFormData.price.toLowerCase().includes('lac')) {
        numeric = plainNum;
      }
    }

    updateProperty(editingProperty.id, {
      ...editFormData,
      priceNumeric: numeric
    }).then(() => setEditingProperty(null)).catch(() => {
      alert('Could not save changes. Please confirm the backend server is running.');
    });
  };

  // Delete property
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this property listing permanently?')) {
      deleteProperty(id);
    }
  };

  // Toggle Sold status instantly
  const toggleSoldStatus = (property) => {
    updateProperty(property.id, { isSold: !property.isSold }).catch(() => {
      alert('Could not update status. Please confirm the backend server is running.');
    });
  };

  // Amenity additions/removals inside edit modal
  const handleAddAmenity = () => {
    if (newAmenity.trim() && !editFormData.amenities.includes(newAmenity.trim())) {
      setEditFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (amenity) => {
    setEditFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  // Filtering based on search
  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.type && p.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-dashboard container animate-fade-in">
      <div className="admin-header">
        <div>
          <h1>Admin <span className="gradient-text">Dashboard</span></h1>
          <p className="text-secondary">Full control over real estate listings and status updates.</p>
        </div>
        <Button variant="outline" onClick={logout}>Logout</Button>
      </div>

      {/* Stats Summary Panel */}
      <div className="stats-summary">
        <div className="stats-card total glass-panel">
          <h4>Total Properties</h4>
          <div className="value">{totalListings}</div>
        </div>
        <div className="stats-card glass-panel">
          <h4>Available listings</h4>
          <div className="value">{availableListings}</div>
        </div>
        <div className="stats-card sold glass-panel">
          <h4>Sold Listings</h4>
          <div className="value">{soldListings}</div>
        </div>
        <div className="stats-card pending glass-panel" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--color-accent)' }}></div>
          <h4>Pending Approval</h4>
          <div className="value" style={{ color: 'var(--color-accent)' }}>{pendingApproval}</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="admin-controls">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search by title, location or type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Properties Table */}
      <div className="admin-table-container glass-panel">
        {error && (
          <div style={{ padding: '1rem', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading listings from SQLite...
          </div>
        ) : filteredProperties.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th>Price</th>
                <th>Specs</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((prop) => (
                <tr key={prop.id} className={prop.isSold ? 'sold-row' : ''}>
                  <td>
                    <div className="prop-info-cell">
                      <img 
                        src={prop.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'} 
                        alt={prop.title} 
                        className="prop-thumbnail"
                      />
                      <div className="prop-details-text">
                        <span className="prop-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {prop.title}
                          {prop.videoUrl && (
                            <span style={{ 
                              background: 'rgba(239, 68, 68, 0.15)', 
                              color: '#ef4444', 
                              padding: '1px 6px', 
                              borderRadius: '4px', 
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }} title="Has video walkthrough">
                              ▶ Video
                            </span>
                          )}
                        </span>
                        <span className="prop-location">{prop.location}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize' }}>{prop.type || 'villa'}</span>
                  </td>
                  <td style={{ fontWeight: '600' }}>₹ {prop.price}</td>
                  <td style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    {prop.beds} BHK • {prop.baths} Bath • {prop.sqft} SqFt
                  </td>
                  <td>
                    {!prop.isApproved ? (
                      <span className="status-badge pending" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-accent)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        Pending
                      </span>
                    ) : (
                      <span className={`status-badge ${prop.isSold ? 'sold' : 'available'}`}>
                        {prop.isSold ? 'Sold' : 'Available'}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {!prop.isApproved && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          icon={<Check size={14} />} 
                          onClick={() => updateProperty(prop.id, { isApproved: true }).catch(() => {
                            alert('Could not approve listing. Please confirm the backend server is running.');
                          })}
                          title="Approve Listing"
                        >
                          Approve
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={<Edit2 size={14} />} 
                        onClick={() => startEdit(prop)}
                        title="Edit details"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant={prop.isSold ? 'outline' : 'secondary'} 
                        size="sm" 
                        icon={prop.isSold ? <RotateCcw size={14} /> : <Check size={14} />}
                        onClick={() => toggleSoldStatus(prop)}
                        title={prop.isSold ? "Mark as Available" : "Mark as Sold"}
                      >
                        {prop.isSold ? 'Make Avail' : 'Mark Sold'}
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        icon={<Trash2 size={14} />} 
                        onClick={() => handleDelete(prop.id)}
                        title="Delete Property"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <AlertTriangle size={36} style={{ marginBottom: '1rem', color: 'var(--color-accent)' }} />
            <h3>No listings found</h3>
            <p>Try searching for a different keyword or list new properties.</p>
          </div>
        )}
      </div>

      {/* Edit Property Modal Dialog */}
      {editingProperty && (
        <div className="admin-modal-overlay" onClick={cancelEdit}>
          <div className="admin-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Edit <span className="gradient-text">Listing Details</span></h2>
              <button className="admin-modal-close" onClick={cancelEdit}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="edit-form-grid">
              
              <div className="edit-form-group full-width">
                <label>Property Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  value={editFormData.title || ''} 
                  onChange={handleFormChange} 
                  required
                />
              </div>

              <div className="edit-form-group">
                <label>Property Type</label>
                <select 
                  name="type" 
                  value={editFormData.type || 'villa'} 
                  onChange={handleFormChange}
                >
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa / Independent House</option>
                  <option value="plot">Plot</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div className="edit-form-group">
                <label>Price Description * (e.g. 2.5 Cr or 85 Lacs)</label>
                <input 
                  type="text" 
                  name="price" 
                  value={editFormData.price || ''} 
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label>Location / Neighborhood *</label>
                <input 
                  type="text" 
                  name="location" 
                  value={editFormData.location || ''} 
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label>Property Size (Sq. Ft.)</label>
                <input 
                  type="number" 
                  name="sqft" 
                  value={editFormData.sqft || ''} 
                  onChange={handleFormChange}
                />
              </div>

              <div className="edit-form-group">
                <label>Bedrooms (BHK)</label>
                <input 
                  type="number" 
                  name="beds" 
                  value={editFormData.beds || ''} 
                  onChange={handleFormChange}
                />
              </div>

              <div className="edit-form-group">
                <label>Bathrooms</label>
                <input 
                  type="number" 
                  name="baths" 
                  value={editFormData.baths || ''} 
                  onChange={handleFormChange}
                />
              </div>

              <div className="edit-form-group">
                <label>Owner Name</label>
                <input 
                  type="text" 
                  name="ownerName" 
                  value={editFormData.ownerName || ''} 
                  onChange={handleFormChange}
                />
              </div>

              <div className="edit-form-group">
                <label>Owner Phone</label>
                <input 
                  type="text" 
                  name="ownerPhone" 
                  value={editFormData.ownerPhone || ''} 
                  onChange={handleFormChange}
                />
              </div>

              <div className="edit-form-group full-width">
                <label>Primary Image URL</label>
                <input 
                  type="text" 
                  name="image" 
                  value={editFormData.image || ''} 
                  onChange={handleFormChange} 
                />
              </div>

              <div className="edit-form-group full-width">
                <label>Video Tour URL (Optional)</label>
                <input 
                  type="url" 
                  name="videoUrl" 
                  value={editFormData.videoUrl || ''} 
                  onChange={handleFormChange} 
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                />
              </div>

              <div className="edit-form-group full-width">
                <label>Detailed Description</label>
                <textarea 
                  name="description" 
                  value={editFormData.description || ''} 
                  onChange={handleFormChange} 
                  rows="4"
                />
              </div>

              <div className="edit-form-group full-width">
                <label>Amenities</label>
                <div className="add-amenity-row">
                  <input 
                    type="text" 
                    placeholder="Type new amenity..." 
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddAmenity} icon={<Plus size={16} />}>
                    Add
                  </Button>
                </div>
                <div className="amenities-edit-container">
                  {editFormData.amenities && editFormData.amenities.map((amenity, idx) => (
                    <span key={idx} className="amenity-edit-tag">
                      {amenity}
                      <button type="button" onClick={() => handleRemoveAmenity(amenity)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="edit-form-group full-width" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    name="isApproved" 
                    checked={editFormData.isApproved || false} 
                    onChange={handleFormChange}
                    style={{ width: 'auto' }}
                  />
                  <span>Approved Listing (Visible to Public)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    name="isSold" 
                    checked={editFormData.isSold || false} 
                    onChange={handleFormChange}
                    style={{ width: 'auto' }}
                  />
                  <span>Mark Property as Sold</span>
                </label>
              </div>

              <div className="edit-form-actions">
                <Button type="button" variant="ghost" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
