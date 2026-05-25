import { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import Button from '../components/Button';
import PropertyCard from '../components/PropertyCard';
import { useProperties } from '../context/PropertyContext';
import './AIMatch.css';

const LIFESTYLE_OPTIONS = ['Quiet & Peaceful', 'City Center Rush', 'Nature Surroundings', 'Luxury & Premium'];
const FAMILY_OPTIONS = ['Just Me', 'Couple', 'Small Family (1-2 kids)', 'Large Family'];
const MUSTHAVE_OPTIONS = ['Gated Society', 'Near Schools', 'Park Facing', 'Gym / Club', 'Power Backup', 'Metro Connectivity'];

const AIMatch = () => {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Track selections for each step
  const [selectedLifestyle, setSelectedLifestyle] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [selectedMustHaves, setSelectedMustHaves] = useState([]);

  const { properties } = useProperties();

  const toggleMustHave = (item) => {
    if (selectedMustHaves.includes(item)) {
      setSelectedMustHaves(prev => prev.filter(i => i !== item));
    } else if (selectedMustHaves.length < 3) {
      setSelectedMustHaves(prev => [...prev, item]);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowResults(true);
      }, 2500);
    }
  };

  const handleRetake = () => {
    setShowResults(false);
    setStep(1);
    setSelectedLifestyle(null);
    setSelectedFamily(null);
    setSelectedMustHaves([]);
  };

  // Can advance only if a selection has been made on the current step
  const canAdvance = () => {
    if (step === 1) return selectedLifestyle !== null;
    if (step === 2) return selectedFamily !== null;
    if (step === 3) return selectedMustHaves.length > 0;
    return true;
  };

  // AI recommendations: use global properties, generate pseudo-random scores based on user selections
  const getRecommendations = () => {
    return properties
      .filter(p => p.isApproved && !p.isSold)
      .map(p => {
        let score = 70;
        // Boost score based on lifestyle
        if (selectedLifestyle === 'Luxury & Premium' && (p.priceNumeric || 0) >= 100) score += 15;
        if (selectedLifestyle === 'Quiet & Peaceful' && p.type === 'villa') score += 12;
        if (selectedLifestyle === 'Nature Surroundings' && p.type === 'plot') score += 15;
        if (selectedLifestyle === 'City Center Rush' && p.type === 'apartment') score += 12;
        
        // Boost based on family size
        if (selectedFamily === 'Just Me' && p.beds <= 1) score += 10;
        if (selectedFamily === 'Couple' && p.beds >= 2 && p.beds <= 3) score += 10;
        if (selectedFamily === 'Small Family (1-2 kids)' && p.beds >= 3 && p.beds <= 4) score += 10;
        if (selectedFamily === 'Large Family' && p.beds >= 4) score += 10;

        // Boost based on amenities overlap
        const propertyAmenities = (p.amenities || []).map(a => a.toLowerCase());
        selectedMustHaves.forEach(mh => {
          if (propertyAmenities.some(a => a.includes(mh.toLowerCase().split(' ')[0]))) score += 5;
        });

        return { ...p, aiScore: Math.min(score, 99) };
      })
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 3);
  };

  return (
    <div className="ai-match-page container">
      {!showResults && !isAnalyzing && (
        <div className="wizard-container glass-panel animate-fade-in">
          <div className="wizard-header text-center">
            <Sparkles size={32} className="text-accent mx-auto mb-4" />
            <h2>Find Your Perfect Match</h2>
            <p className="text-secondary">Let our AI analyze your preferences to find the ideal home in Bhopal.</p>
          </div>

          <div className="progress-bar">
            <div className="progress" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
          <p className="step-indicator text-secondary">Step {step} of 3</p>

          <div className="wizard-body">
            {step === 1 && (
              <div className="step-content animate-fade-in">
                <h3>What's your preferred lifestyle?</h3>
                <div className="options-grid">
                  {LIFESTYLE_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`option-card ${selectedLifestyle === opt ? 'active' : ''}`}
                      onClick={() => setSelectedLifestyle(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="step-content animate-fade-in">
                <h3>Who are you moving with?</h3>
                <div className="options-grid">
                  {FAMILY_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`option-card ${selectedFamily === opt ? 'active' : ''}`}
                      onClick={() => setSelectedFamily(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-content animate-fade-in">
                <h3>What are your must-haves? <span className="text-secondary text-sm">(Select up to 3)</span></h3>
                <div className="options-grid multi-select">
                  {MUSTHAVE_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`option-card ${selectedMustHaves.includes(opt) ? 'active' : ''} ${selectedMustHaves.length >= 3 && !selectedMustHaves.includes(opt) ? 'disabled' : ''}`}
                      onClick={() => toggleMustHave(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {selectedMustHaves.length > 0 && (
                  <p className="selection-count text-secondary">{selectedMustHaves.length}/3 selected</p>
                )}
              </div>
            )}
          </div>

          <div className="wizard-footer">
            {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
            <Button
              variant="primary"
              onClick={handleNext}
              className={`ml-auto ${!canAdvance() ? 'btn-disabled' : ''}`}
              disabled={!canAdvance()}
            >
              {step === 3 ? "Generate Matches" : "Next"} <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="analyzing-state text-center animate-fade-in">
          <Loader2 size={64} className="loader-icon mx-auto text-primary" />
          <h2>AI is analyzing the Bhopal market...</h2>
          <p className="text-secondary mt-4">Matching your lifestyle preferences with {properties.length}+ premium properties.</p>
        </div>
      )}

      {showResults && (
        <div className="results-container animate-fade-in">
          <div className="results-header">
            <div>
              <h2 className="section-title"><Sparkles size={28} className="text-accent inline-icon" /> AI <span className="gradient-text">Matches</span> Found</h2>
              <p className="text-secondary">Based on your preferences: <strong>{selectedLifestyle}</strong> lifestyle, <strong>{selectedFamily}</strong>, with {selectedMustHaves.join(', ')}.</p>
            </div>
            <Button variant="outline" onClick={handleRetake} icon={<RotateCcw size={16} />}>Retake Quiz</Button>
          </div>
          
          <div className="properties-grid">
            {getRecommendations().map(property => (
              <PropertyCard key={property.id} property={{...property, isAiMatch: true, matchScore: property.aiScore}} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIMatch;
