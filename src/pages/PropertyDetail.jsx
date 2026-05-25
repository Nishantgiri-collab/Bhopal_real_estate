import { Fragment, useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Bed, Bath, Square, Share2, Heart, CheckCircle2,
  MessageCircle, Phone, Mail, User, ShieldCheck, SmartphoneNfc,
  MailCheck, Lock, ChevronRight, RefreshCw, X
} from 'lucide-react';
import Button from '../components/Button';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import './PropertyDetail.css';

const API = '/api';

// ─── OTP Input: 6 individual digit boxes ──────────────────────────────────────
const OTPInput = ({ value, onChange, disabled }) => {
  const inputsRef = useRef([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const next = [...digits];
      next[idx] = '';
      onChange(next.join(''));
      return;
    }
    const char = val[val.length - 1];
    const next = [...digits];
    next[idx] = char;
    onChange(next.join(''));
    if (idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    const nextIdx = Math.min(pasted.length, 5);
    inputsRef.current[nextIdx]?.focus();
  };

  return (
    <div className="otp-boxes">
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          className={`otp-box ${d ? 'filled' : ''}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
};

// ─── Step Indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ currentStep, steps }) => (
  <div className="step-indicator">
    {steps.map((label, idx) => (
      <Fragment key={idx}>
        <div className={`step-dot ${idx < currentStep ? 'done' : idx === currentStep ? 'active' : ''}`}>
          {idx < currentStep ? <CheckCircle2 size={14} /> : <span>{idx + 1}</span>}
        </div>
        {idx < steps.length - 1 && (
          <div className={`step-line ${idx < currentStep - 1 ? 'done' : ''}`} />
        )}
      </Fragment>
    ))}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties } = useProperties();
  const { isAuthenticated } = useAuth();
  const [activeImage, setActiveImage] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  // step: 0=closed, 1=userDetails form, 2=SMS OTP, 3=Email OTP, 4=success
  const [step, setStep] = useState(1);

  // User details
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // SMS OTP
  const [smsOtp, setSmsOtp] = useState('');
  const [smsError, setSmsError] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsMockOtp, setSmsMockOtp] = useState('');
  const [smsResendTimer, setSmsResendTimer] = useState(0);

  // Email OTP
  const [emailOtp, setEmailOtp] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResendTimer, setEmailResendTimer] = useState(0);

  // Resend countdown effect
  useEffect(() => {
    if (smsResendTimer <= 0) return;
    const t = setTimeout(() => setSmsResendTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [smsResendTimer]);

  useEffect(() => {
    if (emailResendTimer <= 0) return;
    const t = setTimeout(() => setEmailResendTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [emailResendTimer]);

  const property = properties.find(p => p.id.toString() === id);

  if (!property || (!property.isApproved && !isAuthenticated)) {
    return (
      <div className="property-detail-page container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', textAlign: 'center' }}>
        <h2>Listing Awaiting Approval</h2>
        <p className="text-secondary" style={{ maxWidth: '500px' }}>This property listing has been submitted and is currently pending review by the site administrator.</p>
        <Button variant="primary" onClick={() => navigate('/properties')}>Browse Active Listings</Button>
      </div>
    );
  }

  const propertyImages = Array.isArray(property.images) ? property.images : [property.image];
  const propertyAmenities = property.amenities || [];

  // ─── Open modal ─────────────────────────────────────────────────────────────
  const openModal = () => {
    setStep(1);
    setFormData({ name: '', phone: '', email: '' });
    setFormErrors({});
    setSmsOtp(''); setSmsError(''); setSmsMockOtp(''); setSmsResendTimer(0);
    setEmailOtp(''); setEmailError(''); setEmailResendTimer(0);
    setIsModalOpen(true);
  };

  // ─── Step 1: Validate & Submit user details ──────────────────────────────
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required.';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required.';
    else if (!/^\+?[0-9]{10,13}$/.test(formData.phone.replace(/\s/g, '')))
      errors.phone = 'Enter a valid 10-digit phone number.';
    if (!formData.email.trim()) errors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Enter a valid email address.';
    return errors;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setFormLoading(true);
    try {
      // 1. Save lead request to SQLite
      const ownerRequestRes = await fetch(`${API}/owner-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          propertyId: property.id.toString(),
          propertyTitle: property.title,
          ownerPhone: property.ownerPhone || '',
        }),
      });
      if (!ownerRequestRes.ok) {
        throw new Error('Could not save your request.');
      }

      // 2. Notify owner via WhatsApp (best-effort)
      fetch(`${API}/notify-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerPhone: property.ownerPhone || '',
          userName: formData.name,
          userPhone: formData.phone,
          userEmail: formData.email,
          propertyTitle: property.title,
        }),
      }).catch(() => {});

      // 3. Send SMS OTP
      await sendSmsOtp();
    } catch {
      setFormErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Step 2: Send SMS OTP ────────────────────────────────────────────────
  const sendSmsOtp = async () => {
    setSmsLoading(true); setSmsError(''); setSmsMockOtp('');
    try {
      const res = await fetch(`${API}/send-otp/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
      });
      const data = await res.json();
      if (data.mock && data.otp) setSmsMockOtp(data.otp);
      setSmsResendTimer(60);
      setStep(2);
    } catch {
      setSmsError('Failed to send SMS OTP. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleSmsVerify = async () => {
    if (smsOtp.length !== 6) { setSmsError('Enter all 6 digits.'); return; }
    setSmsLoading(true); setSmsError('');
    try {
      const res = await fetch(`${API}/verify-otp/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone, otp: smsOtp }),
      });
      const data = await res.json();
      if (data.success) {
        await sendEmailOtp();
      } else {
        setSmsError(data.error || 'Incorrect OTP. Please try again.');
      }
    } catch {
      setSmsError('Verification failed. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  // ─── Step 3: Send Email OTP ──────────────────────────────────────────────
  const sendEmailOtp = async () => {
    setEmailLoading(true); setEmailError('');
    setStep(3);
    try {
      const res = await fetch(`${API}/send-otp/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to send email OTP.');
      }
      setEmailResendTimer(60);
    } catch (err) {
      setEmailError(err.message || 'Failed to send email OTP. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailVerify = async () => {
    if (emailOtp.length !== 6) { setEmailError('Enter all 6 digits.'); return; }
    setEmailLoading(true); setEmailError('');
    try {
      const res = await fetch(`${API}/verify-otp/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: emailOtp }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(4);
      } else {
        setEmailError(data.error || 'Incorrect OTP. Please try again.');
      }
    } catch {
      setEmailError('Verification failed. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const STEPS = ['Your Details', 'Mobile OTP', 'Email OTP', 'Owner Details'];

  // ─── Render modal content per step ────────────────────────────────────────
  const renderModalContent = () => {
    switch (step) {
      // ── Step 1: User Details Form ──────────────────────────────────────────
      case 1:
        return (
          <>
            <div className="modal-header">
              <div className="modal-icon-wrap blue">
                <User size={24} />
              </div>
              <div>
                <h2>Interested in this property?</h2>
                <p className="text-secondary">Get in touch with the owner directly. Enter your details below.</p>
              </div>
            </div>
            <form onSubmit={handleFormSubmit} className="lead-form" noValidate>
              {formErrors.general && <div className="form-error-banner">{formErrors.general}</div>}
              <div className={`form-group ${formErrors.name ? 'has-error' : ''}`}>
                <label><User size={14} /> Full Name</label>
                <input
                  id="lead-name"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                />
                {formErrors.name && <span className="field-error">{formErrors.name}</span>}
              </div>
              <div className={`form-group ${formErrors.phone ? 'has-error' : ''}`}>
                <label><Phone size={14} /> Phone Number</label>
                <input
                  id="lead-phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                />
                {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
              </div>
              <div className={`form-group ${formErrors.email ? 'has-error' : ''}`}>
                <label><Mail size={14} /> Email Address</label>
                <input
                  id="lead-email"
                  type="email"
                  placeholder="e.g. rahul@gmail.com"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                />
                {formErrors.email && <span className="field-error">{formErrors.email}</span>}
              </div>
              <Button variant="primary" fullWidth type="submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : <>Continue to Verification <ChevronRight size={16} /></>}
              </Button>
            </form>
          </>
        );

      // ── Step 2: SMS OTP ────────────────────────────────────────────────────
      case 2:
        return (
          <>
            <div className="modal-header">
              <div className="modal-icon-wrap purple">
                <SmartphoneNfc size={24} />
              </div>
              <div>
                <h2>Mobile Verification</h2>
                <p className="text-secondary">
                  We sent a 6-digit OTP to <strong>{formData.phone}</strong>
                </p>
              </div>
            </div>
            {smsMockOtp && (
              <div className="mock-otp-banner">
                🔧 Dev Mode — OTP: <strong>{smsMockOtp}</strong>
                <span>(Twilio not configured)</span>
              </div>
            )}
            <OTPInput value={smsOtp} onChange={setSmsOtp} disabled={smsLoading} />
            {smsError && <p className="otp-error">{smsError}</p>}
            <Button variant="primary" fullWidth onClick={handleSmsVerify} disabled={smsLoading || smsOtp.length < 6}>
              {smsLoading ? 'Verifying...' : <>Verify Mobile OTP <ShieldCheck size={16} /></>}
            </Button>
            <div className="resend-row">
              {smsResendTimer > 0
                ? <span className="text-secondary">Resend OTP in {smsResendTimer}s</span>
                : <button className="resend-btn" onClick={sendSmsOtp} disabled={smsLoading}>
                    <RefreshCw size={13} /> Resend OTP
                  </button>
              }
            </div>
          </>
        );

      // ── Step 3: Email OTP ──────────────────────────────────────────────────
      case 3:
        return (
          <>
            <div className="modal-header">
              <div className="modal-icon-wrap green">
                <MailCheck size={24} />
              </div>
              <div>
                <h2>Email Verification</h2>
                <p className="text-secondary">
                  We sent a 6-digit OTP to <strong>{formData.email}</strong>
                </p>
              </div>
            </div>
            <OTPInput value={emailOtp} onChange={setEmailOtp} disabled={emailLoading} />
            {emailError && <p className="otp-error">{emailError}</p>}
            <Button variant="primary" fullWidth onClick={handleEmailVerify} disabled={emailLoading || emailOtp.length < 6}>
              {emailLoading ? 'Verifying...' : <>Verify Email OTP <ShieldCheck size={16} /></>}
            </Button>
            <div className="resend-row">
              {emailResendTimer > 0
                ? <span className="text-secondary">Resend OTP in {emailResendTimer}s</span>
                : <button className="resend-btn" onClick={sendEmailOtp} disabled={emailLoading}>
                    <RefreshCw size={13} /> Resend OTP
                  </button>
              }
            </div>
          </>
        );

      // ── Step 4: Success — Owner Details Revealed ───────────────────────────
      case 4:
        return (
          <div className="success-reveal">
            <div className="success-checkmark">
              <ShieldCheck size={48} />
            </div>
            <h2>Identity Verified!</h2>
            <p className="text-secondary">Both OTPs verified. Here are the owner's contact details:</p>
            <div className="owner-details-card">
              <div className="owner-detail-row">
                <User size={18} />
                <div>
                  <span className="detail-label">Owner Name</span>
                  <strong>{property.ownerName || 'Property Owner'}</strong>
                </div>
              </div>
              <div className="owner-detail-row">
                <Phone size={18} />
                <div>
                  <span className="detail-label">Phone Number</span>
                  <strong>{property.ownerPhone || 'Not provided'}</strong>
                </div>
              </div>
              {property.ownerEmail && (
                <div className="owner-detail-row">
                  <Mail size={18} />
                  <div>
                    <span className="detail-label">Email</span>
                    <strong>{property.ownerEmail}</strong>
                  </div>
                </div>
              )}
            </div>
            <div className="success-actions">
              {property.ownerPhone && (
                <Button
                  variant="primary"
                  fullWidth
                  icon={<MessageCircle size={16} />}
                  onClick={() => {
                    const clean = (property.ownerPhone || '').replace(/[^0-9]/g, '');
                    const msg = encodeURIComponent(`Hello, I'm interested in your property "${property.title}" listed on Bhopal Estates.`);
                    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
                  }}
                >
                  Chat on WhatsApp
                </Button>
              )}
              <Button variant="outline" fullWidth onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="property-detail-page container">
      {/* Header */}
      <div className="property-header">
        <div className="title-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1>{property.title}</h1>
            {property.isSold && <span className="status-badge sold">Sold</span>}
          </div>
          <p className="location"><MapPin size={18} /> {property.location}</p>
        </div>
        <div className="price-section">
          <h2>₹ {property.price}</h2>
          <div className="action-buttons">
            <Button variant="ghost" icon={<Share2 size={18} />}>Share</Button>
            <Button variant="ghost" icon={<Heart size={18} />}>Save</Button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="image-gallery">
        <div className="main-image">
          <img src={propertyImages[activeImage]} alt="Main Property" />
        </div>
        <div className="thumbnail-list">
          {propertyImages.map((img, idx) => (
            <div
              key={idx}
              className={`thumbnail ${activeImage === idx ? 'active' : ''}`}
              onClick={() => setActiveImage(idx)}
            >
              <img src={img} alt={`Thumbnail ${idx}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Content Layout */}
      <div className="property-content-layout">
        <div className="property-info">
          <div className="features-bar glass-panel">
            <div className="feature-item">
              <Bed size={24} className="text-secondary" />
              <div><strong>{property.beds}</strong><p>Bedrooms</p></div>
            </div>
            <div className="divider" />
            <div className="feature-item">
              <Bath size={24} className="text-secondary" />
              <div><strong>{property.baths}</strong><p>Bathrooms</p></div>
            </div>
            <div className="divider" />
            <div className="feature-item">
              <Square size={24} className="text-secondary" />
              <div><strong>{property.sqft}</strong><p>Sq Ft</p></div>
            </div>
          </div>

          <div className="description-section">
            <h3>About this Property</h3>
            <p>{property.description || 'No description provided for this property.'}</p>
          </div>

          {property.videoUrl && (
            <div className="video-walkthrough-section glass-panel" style={{ 
              padding: '1.5rem', 
              borderRadius: '12px', 
              marginBottom: '2rem', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.03)'
            }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', color: '#ff4d4d' }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Virtual Video Tour
              </h3>
              <p className="text-secondary mb-4">Experience a virtual tour of this premium Bhopal property. Get a comprehensive look at the layout, design, and spacing prior to your in-person visit.</p>
              <Button 
                variant="primary" 
                style={{ 
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)', 
                  borderColor: '#ef4444',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onClick={() => window.open(property.videoUrl, '_blank', 'noopener,noreferrer')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Watch Video Tour
              </Button>
            </div>
          )}

          <div className="amenities-section">
            <h3>Amenities</h3>
            <ul className="amenities-list">
              {propertyAmenities.map((item, idx) => (
                <li key={idx}><CheckCircle2 size={18} className="text-primary" /> {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sticky Contact Sidebar */}
        <aside className="contact-sidebar">
          <div className="contact-card glass-panel sticky">
            {property.isSold ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <h3 style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>Property Sold</h3>
                <p className="text-secondary mb-6">This listing is no longer active as the property has been marked as sold.</p>
                <Button variant="outline" fullWidth onClick={() => navigate('/properties')}>
                  View Other Properties
                </Button>
              </div>
            ) : (
              <>
                <div className="contact-card-badge">
                  <Lock size={13} /> Verified Access
                </div>
                <h3>Interested in this property?</h3>
                <p className="text-secondary">Get in touch with the owner directly.</p>
                <div className="broker-info">
                  <div className="avatar">
                    {property.ownerName ? property.ownerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'OW'}
                  </div>
                  <div>
                    <strong>{property.ownerName || 'Property Owner'}</strong>
                    <p className="text-secondary">Property Owner</p>
                  </div>
                </div>
                <div className="verification-steps-preview">
                  <div className="vstep"><SmartphoneNfc size={14} /><span>Mobile OTP</span></div>
                  <ChevronRight size={12} className="vstep-arrow" />
                  <div className="vstep"><MailCheck size={14} /><span>Email OTP</span></div>
                  <ChevronRight size={12} className="vstep-arrow" />
                  <div className="vstep"><ShieldCheck size={14} /><span>Owner Details</span></div>
                </div>
                <Button variant="primary" fullWidth onClick={openModal} id="get-owner-details-btn">
                  <Lock size={15} /> Get Owner Details
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  className="mt-4"
                  icon={<MessageCircle size={18} />}
                  onClick={openModal}
                >
                  Chat via WhatsApp
                </Button>
                {property.videoUrl && (
                  <Button
                    variant="primary"
                    fullWidth
                    className="mt-4"
                    style={{
                      background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                      borderColor: '#ef4444',
                      boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onClick={() => window.open(property.videoUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Watch Video Tour
                  </Button>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* ─── Multi-Step Modal ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-content glass-panel animate-fade-in">
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
              <X size={20} />
            </button>

            {step < 4 && (
              <StepIndicator currentStep={step - 1} steps={STEPS} />
            )}

            <div className="modal-body">
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;
