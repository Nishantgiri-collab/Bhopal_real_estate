import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, X, CheckCircle2, Home as HomeIcon } from 'lucide-react';
import Button from '../components/Button';
import { useProperties } from '../context/PropertyContext';
import './AddProperty.css';

const AddProperty = () => {
  const navigate = useNavigate();
  const { addProperty } = useProperties();
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    location: '',
    price: '',
    sqft: '',
    beds: '',
    baths: '',
    description: '',
    ownerName: '',
    ownerPhone: '',
    listingType: '',
    videoUrl: '',
  });
  const [images, setImages] = useState([]); // Array of { file, previewUrl }
  const imagePreviewsRef = useRef([]);

  const [amenities, setAmenities] = useState(['Parking', 'Power Backup']);
  const [newAmenity, setNewAmenity] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = [];
      
      for (let i = 0; i < files.length; i++) {
        if (images.length + newImages.length >= 10) {
          alert('You can upload a maximum of 10 photos.');
          break;
        }
        const file = files[i];
        newImages.push({
          file: file,
          previewUrl: URL.createObjectURL(file)
        });
      }
      
      if (newImages.length > 0) {
        setImages(prev => [...prev, ...newImages]);
      }
    }
  };

  const handleRemoveImage = (index) => {
    setImages(prev => {
      const removed = prev[index];
      if (removed && removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  useEffect(() => {
    imagePreviewsRef.current = images.map(img => img.previewUrl).filter(Boolean);
  }, [images]);

  useEffect(() => () => {
    imagePreviewsRef.current.forEach(previewUrl => URL.revokeObjectURL(previewUrl));
  }, []);

  const handleAddAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (item) => {
    setAmenities(amenities.filter(a => a !== item));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    // Formatting price
    let formattedPrice = formData.price;
    if (Number(formData.price) >= 10000000) {
      formattedPrice = `${(Number(formData.price) / 10000000).toFixed(2)} Cr`;
    } else if (Number(formData.price) >= 100000) {
      formattedPrice = `${(Number(formData.price) / 100000).toFixed(2)} Lacs`;
    }

    try {
      await addProperty({
        title: formData.title,
        type: formData.type,
        listingType: formData.listingType,
        location: formData.location,
        price: formattedPrice,
        priceNumeric: Number(formData.price) / 100000,
        beds: Number(formData.beds),
        baths: Number(formData.baths),
        sqft: Number(formData.sqft),
        imageFiles: images.map(img => img.file),
        description: formData.description,
        amenities: amenities,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        videoUrl: formData.videoUrl
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/admin-dashboard');
      }, 1800);
    } catch {
      setSubmitError('Property could not be saved. Please make sure the backend server is running on port 5000.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-property-page container">
      {!isSuccess ? (
        <div className="form-container glass-panel animate-fade-in">
          <div className="form-header">
            <h1>List Your <span className="gradient-text">Property</span></h1>
            <p className="text-secondary">Reach thousands of premium buyers in Bhopal.</p>
          </div>

          <div className="progress-bar">
            <div className="progress" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }}>
            {submitError && (
              <div className="form-error-banner" style={{ marginBottom: '1rem' }}>
                {submitError}
              </div>
            )}
            
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="form-step animate-fade-in">
                <h3>Basic Details</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Property Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Luxury 3BHK in Arera Colony" />
                  </div>
                  
                  <div className="form-group">
                    <label>Property Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} required>
                      <option value="">Select Type</option>
                      <option value="apartment">Apartment / Flat</option>
                      <option value="villa">Independent House / Villa</option>
                      <option value="plot">Residential Plot</option>
                      <option value="commercial">Commercial Space</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Listing Type</label>
                    <select name="listingType" value={formData.listingType} onChange={handleChange} required>
                      <option value="">Select Listing Type</option>
                      <option value="Sell">Sell</option>
                      <option value="Rent">Rent</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Location / Locality</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g. Bawadiya Kalan" />
                  </div>

                  <div className="form-group">
                    <label>Expected Price (₹)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} required placeholder="e.g. 15000000" />
                  </div>

                  <div className="form-group">
                    <label>Area (Sq. Ft.)</label>
                    <input type="number" name="sqft" value={formData.sqft} onChange={handleChange} required placeholder="e.g. 1800" />
                  </div>

                  <div className="form-group">
                    <label>Owner Name</label>
                    <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} required placeholder="e.g. Vikram Singh" />
                  </div>

                  <div className="form-group">
                    <label>Owner Phone Number</label>
                    <input type="tel" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} required placeholder="e.g. +91 99887 76655" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Features & Amenities */}
            {step === 2 && (
              <div className="form-step animate-fade-in">
                <h3>Features & Amenities</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Bedrooms</label>
                    <input type="number" name="beds" value={formData.beds} onChange={handleChange} required min="0" placeholder="Number of beds" />
                  </div>
                  
                  <div className="form-group">
                    <label>Bathrooms</label>
                    <input type="number" name="baths" value={formData.baths} onChange={handleChange} required min="0" placeholder="Number of baths" />
                  </div>

                  <div className="form-group full-width">
                    <label>Property Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} required rows="4" placeholder="Highlight the key features of your property..."></textarea>
                  </div>

                  <div className="form-group full-width">
                    <label>Amenities</label>
                    <div className="amenity-input-wrapper">
                      <input 
                        type="text" 
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        placeholder="Add an amenity (e.g. Gym, Swimming Pool)" 
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                      />
                      <Button type="button" variant="outline" onClick={handleAddAmenity} icon={<Plus size={18} />}>Add</Button>
                    </div>
                    <div className="amenities-tags">
                      {amenities.map((item, idx) => (
                        <span key={idx} className="amenity-tag">
                          {item}
                          <button type="button" onClick={() => handleRemoveAmenity(item)}><X size={14} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Media Upload */}
            {step === 3 && (
              <div className="form-step animate-fade-in">
                <h3>Photos & Media</h3>
                <p className="text-secondary mb-4">Upload up to 10 high-quality photos to attract serious buyers.</p>
                
                <div className="photo-upload-container">
                  <div className="upload-zone">
                    <div className="upload-icon">
                      <Upload size={32} />
                    </div>
                    <h4>Click to upload or drag and drop</h4>
                    <p className="text-secondary text-sm mt-2">PNG, JPG or WEBP (Max 10 photos)</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleImageChange} 
                      className="hidden-input" 
                      disabled={images.length >= 10}
                    />
                  </div>

                  {images.length > 0 && (
                    <div className="upload-progress-info mt-4 flex justify-between items-center">
                      <span className="text-secondary">{images.length} / 10 photos uploaded</span>
                      {images.length >= 10 && <span className="text-danger text-sm" style={{ color: 'var(--color-danger)' }}>Max limit reached</span>}
                    </div>
                  )}

                  {images.length > 0 && (
                    <div className="image-preview-grid">
                      {images.map((img, idx) => (
                        <div key={idx} className="preview-card animate-fade-in">
                          <img src={img.previewUrl} alt={`Upload preview ${idx + 1}`} />
                          <button 
                            type="button" 
                            className="delete-preview-btn" 
                            onClick={() => handleRemoveImage(idx)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="video-url-input-container mt-6">
                  <h3 className="mb-2" style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--color-accent)' }}>▶</span> Video Walkthrough URL <span className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: '400' }}>(Optional)</span>
                  </h3>
                  <p className="text-secondary mb-4">Provide a YouTube, Vimeo, Google Drive, or other public video link showing a tour of the property.</p>
                  
                  <div className="form-group full-width">
                    <input 
                      type="url" 
                      name="videoUrl" 
                      value={formData.videoUrl} 
                      onChange={handleChange} 
                      placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1rem', 
                        borderRadius: '8px', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--color-text)',
                        fontSize: '1rem',
                        transition: 'border-color var(--transition-fast)'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-footer mt-8 flex justify-between border-t border-slate-700 pt-6">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
              ) : <div></div>}
              
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {step === 3 ? (isSubmitting ? "Listing..." : "List Property") : "Next Step"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="success-container glass-panel text-center animate-fade-in">
          <div className="success-icon mx-auto mb-6 flex justify-center text-secondary">
            <CheckCircle2 size={80} />
          </div>
          <h1>Property Listed Successfully!</h1>
          <p className="text-secondary mt-4 mb-8 text-lg">Your property is saved in SQLite and is waiting for admin approval.</p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => { setIsSuccess(false); setStep(1); }}>List Another</Button>
            <Button variant="primary" onClick={() => navigate('/properties')} icon={<HomeIcon size={18} />}>Go to Properties</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProperty;
