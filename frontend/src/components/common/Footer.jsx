import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Sparkles, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer style={{
      backgroundColor: '#0F172A',
      color: '#94A3B8',
      paddingTop: '64px',
      paddingBottom: '36px',
      marginTop: '80px',
      borderTop: '1px solid #1E293B'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
          marginBottom: '48px'
        }}>
          {/* Column 1: Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '1.2rem'
              }}>
                🥗
              </div>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#FFFFFF'
              }}>
                Fit<span style={{ color: '#10B981' }}>Bite</span>
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '16px', color: '#94A3B8' }}>
              FitBite combines flexible restaurant ordering, affordable tiffin subscriptions, personalized 7-day diet plans, and deep food customization.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1E293B',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#10B981',
              fontWeight: 600
            }}>
              <Sparkles size={14} /> Main USP: “Your meals, your way.”
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '18px', fontWeight: 700 }}>
              Quick Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li><Link to="/explore" style={{ color: '#94A3B8', transition: 'color 150ms' }}>Browse All Meals</Link></li>
              <li><Link to="/subscriptions" style={{ color: '#94A3B8' }}>Tiffin Subscription Plans</Link></li>
              <li><Link to="/build-meal" style={{ color: '#94A3B8' }}>Build Your Own Custom Meal</Link></li>
              <li><Link to="/meal-planner" style={{ color: '#94A3B8' }}>AI / Java 7-Day Diet Planner</Link></li>
              <li><Link to="/seller" style={{ color: '#94A3B8' }}>Partner Kitchen Portal</Link></li>
            </ul>
          </div>

          {/* Column 3: Subscription Policies & Safety */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '18px', fontWeight: 700 }}>
              Policies &amp; Guarantee
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#10B981" /> 14-Digit FSSAI Verified Kitchens
              </li>
              <li>
                <strong>28-Day Professional Cycle:</strong> Up to 2 skip-days that extend your end date.
              </li>
              <li>
                <strong>Student Monthly Plan:</strong> Mon-Fri deliveries. Weekends automatically excluded.
              </li>
              <li>
                <strong>Steel Dabba Exchange:</strong> Eco-friendly daily container exchange at your doorstep.
              </li>
            </ul>
          </div>

          {/* Column 4: Demo Credentials & Support */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '18px', fontWeight: 700 }}>
              Demonstration &amp; Support
            </h4>
            <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '12px', fontSize: '0.8rem', lineHeight: '1.6' }}>
              <div style={{ color: '#F97316', fontWeight: 700, marginBottom: '4px' }}>Demo Testing Accounts:</div>
              <div>Customer: <code>customer@fitbite.demo</code></div>
              <div>Seller: <code>seller.tiffin@fitbite.demo</code></div>
              <div>Admin: <code>admin@fitbite.demo</code></div>
              <div style={{ color: '#64748B', marginTop: '6px' }}>Password: <code>FitBite@2026</code> (Admin: <code>FitBite@Admin2026</code>)</div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.82rem', color: '#64748B' }}>
              Bengaluru Delivery Hub: Indiranagar, HSR, Koramangala
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid #1E293B',
          paddingTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '0.82rem'
        }}>
          <div>
            &copy; {new Date().getFullYear()} FitBite Technologies India Pvt. Ltd. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>FSSAI Hygiene Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
