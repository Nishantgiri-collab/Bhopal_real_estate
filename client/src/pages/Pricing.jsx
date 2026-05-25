import { Check, X } from 'lucide-react';
import Button from '../components/Button';
import './Pricing.css';

const Pricing = () => {
  return (
    <div className="pricing-page container">
      <div className="pricing-header text-center">
        <h1>Simple, Transparent <span className="gradient-text">Pricing</span></h1>
        <p className="text-secondary mt-4">Choose the plan that best fits your real estate business in Bhopal.</p>
      </div>

      <div className="pricing-grid">
        {/* Basic Plan */}
        <div className="pricing-card glass-panel">
          <div className="pricing-card-header">
            <h3>Basic</h3>
            <div className="price">
              <span className="currency">₹</span>
              <span className="amount">1,999</span>
              <span className="period">/mo</span>
            </div>
            <p className="text-secondary">Perfect for individual agents</p>
          </div>
          
          <div className="pricing-features">
            <ul>
              <li><Check size={18} className="text-primary" /> 10 Property Listings</li>
              <li><Check size={18} className="text-primary" /> Basic Analytics</li>
              <li><Check size={18} className="text-primary" /> 5 Lead Unlocks / month</li>
              <li><X size={18} className="text-secondary" /> No AI Recommendations</li>
              <li><X size={18} className="text-secondary" /> No Featured Listings</li>
            </ul>
          </div>
          
          <Button variant="outline" fullWidth>Get Started</Button>
        </div>

        {/* Pro Plan */}
        <div className="pricing-card glass-panel popular">
          <div className="popular-badge">Most Popular</div>
          <div className="pricing-card-header">
            <h3>Professional</h3>
            <div className="price">
              <span className="currency">₹</span>
              <span className="amount">4,999</span>
              <span className="period">/mo</span>
            </div>
            <p className="text-secondary">For growing agencies</p>
          </div>
          
          <div className="pricing-features">
            <ul>
              <li><Check size={18} className="text-primary" /> Unlimited Listings</li>
              <li><Check size={18} className="text-primary" /> Advanced Analytics</li>
              <li><Check size={18} className="text-primary" /> 25 Lead Unlocks / month</li>
              <li><Check size={18} className="text-primary" /> AI Match Recommendations</li>
              <li><Check size={18} className="text-primary" /> 5 Featured Listings</li>
            </ul>
          </div>
          
          <Button variant="primary" fullWidth>Get Pro</Button>
        </div>

        {/* Premium Plan */}
        <div className="pricing-card glass-panel">
          <div className="pricing-card-header">
            <h3>Enterprise</h3>
            <div className="price">
              <span className="currency">₹</span>
              <span className="amount">9,999</span>
              <span className="period">/mo</span>
            </div>
            <p className="text-secondary">For large brokerages</p>
          </div>
          
          <div className="pricing-features">
            <ul>
              <li><Check size={18} className="text-primary" /> Everything in Pro</li>
              <li><Check size={18} className="text-primary" /> Unlimited Lead Unlocks</li>
              <li><Check size={18} className="text-primary" /> Dedicated Account Manager</li>
              <li><Check size={18} className="text-primary" /> API Access</li>
              <li><Check size={18} className="text-primary" /> Custom Branding</li>
            </ul>
          </div>
          
          <Button variant="outline" fullWidth>Contact Sales</Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
