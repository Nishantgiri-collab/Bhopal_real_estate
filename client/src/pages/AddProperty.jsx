import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, X, CheckCircle2, Home as HomeIcon } from 'lucide-react';
import Button from '../components/Button';
import { useProperties } from '../context/PropertyContext';
import './AddProperty.css';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;
const OWNER_NAME_PATTERN = /^[A-Za-z\s]+$/;

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
    ownerEmail: '',
    listingType: '',
    videoUrl: '',
  });
  const [images, setImages] = useState([]); // Array of { file, previewUrl }
  const imagePreviewsRef = useRef([]);
  const [validationErrors, setValidationErrors] = useState({});

  const [amenities, setAmenities] = useState(['Parking', 'Power Backup']);
  const [newAmenity, setNewAmenity] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const isAllowedImageFile = (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return ALLOWED_IMAGE_EXTENSIONS.includes(extension) && (!file.type || ALLOWED_IMAGE_TYPES.includes(file.type));
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = [];
      const rejectedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        if (images.length + newImages.length >= 10) {
          alert('You can upload a maximum of 10 photos.');
          break;
        }
        const file = files[i];
        if (!isAllowedImageFile(file)) {
          rejectedFiles.push(file.name);
          continue;
        }
        newImages.push({
          file: file,
          previewUrl: URL.createObjectURL(file)
        });
      }
      
      if (newImages.length > 0) {
        setImages(prev => [...prev, ...newImages]);
        setValidationErrors(prev => {
          const next = { ...prev };
          delete next.images;
          return next;
        });
      }

      if (rejectedFiles.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          images: `Only JPG, JPEG, and PNG images are allowed. Rejected: ${rejectedFiles.join(', ')}`
        }));
      }

      e.target.value = '';
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

  const validateStep = (targetStep) => {
    const errors = {};
    const title = formData.title.trim();
    const description = formData.description.trim();
    const location = formData.location.trim();
    const ownerName = formData.ownerName.trim();
    const ownerPhone = formData.ownerPhone.trim();
    const ownerEmail = formData.ownerEmail.trim();
    const price = Number(formData.price);
    const sqft = Number(formData.sqft);
    const beds = Number(formData.beds);
    const baths = Number(formData.baths);

    if (targetStep === 1 || targetStep === 'all') {
      if (!title) errors.title = 'Property title is required.';
      else if (title.length < 5) errors.title = 'Property title must be at least 5 characters.';
      if (!formData.type) errors.type = 'Please select a property type.';
      if (!formData.listingType) errors.listingType = 'Please select a listing type.';
      if (!location) errors.location = 'Location/address is required.';
      if (!formData.price) errors.price = 'Price is required.';
      else if (!Number.isFinite(price) || price <= 0) errors.price = 'Price must be a positive number.';
      if (!formData.sqft) errors.sqft = 'Area is required.';
      else if (!Number.isFinite(sqft) || sqft <= 100) errors.sqft = 'Area must be numeric and greater than 100 sq. ft.';
      if (!ownerName) errors.ownerName = 'Owner name is required.';
      else if (!OWNER_NAME_PATTERN.test(ownerName)) errors.ownerName = 'Owner name can contain alphabets and spaces only.';
      if (!ownerPhone) errors.ownerPhone = 'Phone number is required.';
      else if (!INDIAN_MOBILE_PATTERN.test(ownerPhone)) errors.ownerPhone = 'Enter a valid 10-digit Indian mobile number.';
      if (!ownerEmail) errors.ownerEmail = 'Email is required.';
      else if (!EMAIL_PATTERN.test(ownerEmail)) errors.ownerEmail = 'Enter a valid email address.';
    }

    if (targetStep === 2 || targetStep === 'all') {
      if (formData.beds === '') errors.beds = 'Bedrooms are required.';
      else if (!Number.isInteger(beds) || beds < 0 || beds >= 10) errors.beds = 'Bedrooms must be an integer from 0 to 9.';
      if (formData.baths === '') errors.baths = 'Bathrooms are required.';
      else if (!Number.isInteger(baths) || baths < 0 || baths >= 10) errors.baths = 'Bathrooms must be an integer from 0 to 9.';
      if (!description) errors.description = 'Description is required.';
      else if (description.length < 10) errors.description = 'Description must be at least 10 characters.';
    }

    if (targetStep === 3 || targetStep === 'all') {
      if (images.length < 1) {
        errors.images = 'At least 1 property image is required.';
      } else {
        const invalidImages = images.filter(img => !isAllowedImageFile(img.file)).map(img => img.file.name);
        if (invalidImages.length > 0) {
          errors.images = `Only JPG, JPEG, and PNG images are allowed. Rejected: ${invalidImages.join(', ')}`;
        }
      }
    }

    return errors;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    const errors = validateStep(step);
    setValidationErrors(errors);
    if (Object.keys(errors).length === 0) {
      setStep(step + 1);
    }
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
    const errors = validateStep('all');
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstStepWithError = errors.title || errors.type || errors.listingType || errors.location || errors.price || errors.sqft || errors.ownerName || errors.ownerPhone || errors.ownerEmail
        ? 1
        : errors.beds || errors.baths || errors.description
          ? 2
          : 3;
      setStep(firstStepWithError);
      return;
    }

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
        title: formData.title.trim(),
        type: formData.type,
        listingType: formData.listingType,
        location: formData.location.trim(),
        price: formattedPrice,
        priceNumeric: Number(formData.price) / 100000,
        beds: Number(formData.beds),
        baths: Number(formData.baths),
        sqft: Number(formData.sqft),
        imageFiles: images.map(img => img.file),
        description: formData.description.trim(),
        amenities: amenities,
        ownerName: formData.ownerName.trim(),
        ownerPhone: formData.ownerPhone.trim(),
        ownerEmail: formData.ownerEmail.trim(),
        videoUrl: formData.videoUrl.trim()
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/admin-dashboard');
      }, 1800);
    } catch (err) {
      console.error('[add-property-page] Submit failed', { error: err?.message || err });
      let message = err?.message || 'Property could not be saved. Please make sure the backend server is running.';
      try {
        const parsed = JSON.parse(message);
        if (parsed.fields && typeof parsed.fields === 'object') {
          setValidationErrors(parsed.fields);
          if (parsed.fields.title || parsed.fields.type || parsed.fields.listingType || parsed.fields.location || parsed.fields.price || parsed.fields.sqft || parsed.fields.ownerName || parsed.fields.ownerPhone || parsed.fields.ownerEmail) {
            setStep(1);
          } else if (parsed.fields.beds || parsed.fields.baths || parsed.fields.description) {
            setStep(2);
          } else {
            setStep(3);
          }
        }
        message = parsed.requestId
          ? `${parsed.error || 'Property could not be saved.'} Request ID: ${parsed.requestId}`
          : parsed.error || message;
      } catch {
        // Keep the original message when the response is plain text or a network error.
      }
      setSubmitError(message);
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

          <form onSubmit={step === 3 ? handleSubmit : handleNextStep} noValidate>
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
                    <input className={validationErrors.title ? 'input-invalid' : ''} type="text" name="title" value={formData.title} onChange={handleChange} required minLength="5" placeholder="e.g. Luxury 3BHK in Arera Colony" />
                    {validationErrors.title && <span className="field-error">{validationErrors.title}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Property Type</label>
                    <select className={validationErrors.type ? 'input-invalid' : ''} name="type" value={formData.type} onChange={handleChange} required>
                      <option value="">Select Type</option>
                      <option value="apartment">Apartment / Flat</option>
                      <option value="villa">Independent House / Villa</option>
                      <option value="plot">Residential Plot</option>
                      <option value="commercial">Commercial Space</option>
                    </select>
                    {validationErrors.type && <span className="field-error">{validationErrors.type}</span>}
                  </div>

                  <div className="form-group">
                    <label>Listing Type</label>
                    <select className={validationErrors.listingType ? 'input-invalid' : ''} name="listingType" value={formData.listingType} onChange={handleChange} required>
                      <option value="">Select Listing Type</option>
                      <option value="Sell">Sell</option>
                      <option value="Rent">Rent</option>
                    </select>
                    {validationErrors.listingType && <span className="field-error">{validationErrors.listingType}</span>}
                  </div>

                  <div className="form-group">
                    <label>Location / Locality</label>
                    <input className={validationErrors.location ? 'input-invalid' : ''} type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g. Bawadiya Kalan" />
                    {validationErrors.location && <span className="field-error">{validationErrors.location}</span>}
                  </div>

                  <div className="form-group">
                    <label>Expected Price (₹)</label>
                    <input className={validationErrors.price ? 'input-invalid' : ''} type="number" name="price" value={formData.price} onChange={handleChange} required min="1" step="any" placeholder="e.g. 15000000" />
                    {validationErrors.price && <span className="field-error">{validationErrors.price}</span>}
                  </div>

                  <div className="form-group">
                    <label>Area (Sq. Ft.)</label>
                    <input className={validationErrors.sqft ? 'input-invalid' : ''} type="number" name="sqft" value={formData.sqft} onChange={handleChange} required min="101" step="any" placeholder="e.g. 1800" />
                    {validationErrors.sqft && <span className="field-error">{validationErrors.sqft}</span>}
                  </div>

                  <div className="form-group">
                    <label>Owner Name</label>
                    <input className={validationErrors.ownerName ? 'input-invalid' : ''} type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} required pattern="[A-Za-z\s]+" placeholder="e.g. Vikram Singh" />
                    {validationErrors.ownerName && <span className="field-error">{validationErrors.ownerName}</span>}
                  </div>

                  <div className="form-group">
                    <label>Owner Phone Number</label>
                    <input className={validationErrors.ownerPhone ? 'input-invalid' : ''} type="tel" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} required pattern="[6-9]\d{9}" maxLength="10" placeholder="e.g. 9988776655" />
                    {validationErrors.ownerPhone && <span className="field-error">{validationErrors.ownerPhone}</span>}
                  </div>

                  <div className="form-group">
                    <label>Owner Email</label>
                    <input className={validationErrors.ownerEmail ? 'input-invalid' : ''} type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} required placeholder="e.g. owner@example.com" />
                    {validationErrors.ownerEmail && <span className="field-error">{validationErrors.ownerEmail}</span>}
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
                    <input className={validationErrors.beds ? 'input-invalid' : ''} type="number" name="beds" value={formData.beds} onChange={handleChange} required min="0" max="9" step="1" placeholder="Number of beds" />
                    {validationErrors.beds && <span className="field-error">{validationErrors.beds}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Bathrooms</label>
                    <input className={validationErrors.baths ? 'input-invalid' : ''} type="number" name="baths" value={formData.baths} onChange={handleChange} required min="0" max="9" step="1" placeholder="Number of baths" />
                    {validationErrors.baths && <span className="field-error">{validationErrors.baths}</span>}
                  </div>

                  <div className="form-group full-width">
                    <label>Property Description</label>
                    <textarea className={validationErrors.description ? 'input-invalid' : ''} name="description" value={formData.description} onChange={handleChange} required minLength="10" rows="4" placeholder="Highlight the key features of your property..."></textarea>
                    {validationErrors.description && <span className="field-error">{validationErrors.description}</span>}
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
                    <p className="text-secondary text-sm mt-2">PNG, JPG or JPEG (Max 10 photos)</p>
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png" 
                      multiple 
                      onChange={handleImageChange} 
                      className="hidden-input" 
                      disabled={images.length >= 10}
                    />
                  </div>
                  {validationErrors.images && <div className="field-error image-error">{validationErrors.images}</div>}

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
