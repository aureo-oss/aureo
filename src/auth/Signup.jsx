import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './Signup.css';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      const userCredential = await signup(email, password);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        createdAt: new Date(),
        emailVerified: false,
        status: 'pending_verification'
      });

      navigate('/verification-pending');
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' 
        ? 'Email already registered' 
        : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      {/* Terms Modal */}
      {showTerms && (
        <div className="legal-modal-overlay">
          <div className="legal-modal">
            <div className="legal-modal-header">
              <h2>Aureo Terms and Conditions</h2>
              <button onClick={() => setShowTerms(false)} className="modal-close-btn">
                &times;
              </button>
            </div>
            <div className="legal-modal-content">
              <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
              
              <h3>1. Acceptance of Terms</h3>
              <p>By using Aureo's event management platform, you agree to these terms. Our services include dashboard management, client tracking, and AI-powered tools.</p>
              
              <h3>2. Account Responsibilities</h3>
              <p>You must provide accurate information and maintain account security. Aureo reserves the right to suspend accounts violating our policies.</p>
              
              <h3>3. Service Usage</h3>
              <p>Our AI assistant provides suggestions but doesn't constitute professional advice. You retain ownership of your content while granting us limited usage rights.</p>
              
              <div className="legal-modal-footer">
                <button onClick={() => setShowTerms(false)} className="primary-btn">
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="legal-modal-overlay">
          <div className="legal-modal">
            <div className="legal-modal-header">
              <h2>Aureo Privacy Policy</h2>
              <button onClick={() => setShowPrivacy(false)} className="modal-close-btn">
                &times;
              </button>
            </div>
            <div className="legal-modal-content">
              <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
              
              <h3>1. Data Collection</h3>
              <p>We collect necessary information to provide our event management services, including email addresses, event details, and usage analytics.</p>
              
              <h3>2. Data Usage</h3>
              <p>Your data helps us improve service quality, personalize experiences, and process transactions. We never sell your information to third parties.</p>
              
              <h3>3. Security Measures</h3>
              <p>Aureo implements industry-standard security including encryption and regular audits to protect your event and client data.</p>
              
              <div className="legal-modal-footer">
                <button onClick={() => setShowPrivacy(false)} className="primary-btn">
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Signup Form */}
      <div className="auth-header">
        <h2>Create an Aureo Account</h2>
        <p className="auth-subheader">Streamline your event management workflow</p>
      </div>

      {error && <div className="error-alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            placeholder="Work Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <div className="password-strength-meter">
            <div style={{ width: `${Math.min((password.length / 8) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          className={`primary-btn ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-footer">
  <p>
    By continuing, you agree to our{' '}
    <button onClick={() => setShowTerms(true)} className="legal-link">
      Terms
    </button>{' '}
    and{' '}
    <button onClick={() => setShowPrivacy(true)} className="legal-link">
      Privacy Policy
    </button>
  </p>
  <p>Already have an account? <a href="/login">Sign In</a></p>
</div>
    </div>
  );
}