import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AureoLogo from '../components/AureoLogo';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePasswordResetEmail = () => {
    const subject = 'Password Reset Request';
    const body = `Please reset my password for account: ${email}\n\nUser Details:\n- Email: ${email}\n- Organization: [Your Organization Name]\n\nRequest Type:\n🔐 Password Reset`;
    window.location.href = `mailto:aureoeventsmanagementteam@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if(err.message === 'EMAIL_NOT_VERIFIED') {
        setShowVerificationModal(true);
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button 
              className="modal-close"
              onClick={() => setShowVerificationModal(false)}
            >
              &times;
            </button>
            <div className="modal-content">
              <h3>Verification Required</h3>
              <p>
                Please contact our support team at{" "}
                <a 
                  href="mailto:aureoeventsmanagementteam@gmail.com" 
                  className="email-link"
                >
                  aureoeventsmanagementteam@gmail.com
                </a>{" "}
                to verify your account.
              </p>
              <div className="modal-actions">
                <button
                  className="modal-btn primary"
                  onClick={() => window.location.href = 'mailto:aureoeventsmanagementteam@gmail.com?subject=Account%20Verification%20Request'}
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button 
              className="modal-close"
              onClick={() => setShowPasswordResetModal(false)}
            >
              &times;
            </button>
            <div className="modal-content">
              <h3>Password Reset Request</h3>
              <p>
                Send an email to our support team with your account details:
              </p>
              <div className="email-template">
                <p className="template-line">
                  <span>To:</span>{' '}
                  <a 
                    href="mailto:aureoeventsmanagementteam@gmail.com" 
                    className="email-link"
                  >
                    aureoeventsmanagementteam@gmail.com
                  </a>
                </p>
                <p className="template-line">
                  <span>Subject:</span> Password Reset Request
                </p>
                <div className="template-body">
                  <p>Please help me reset my password for:</p>
                  <ul>
                    <li>Account Email: {email || '[your@email.com]'}</li>
                    <li>Organization: [Your Organization Name]</li>
                  </ul>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="modal-btn primary"
                  onClick={handlePasswordResetEmail}
                >
                  Open Email Client
                </button>
                <button
                  className="modal-btn secondary"
                  onClick={() => setShowPasswordResetModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branding Section */}
      <section className="login-branding">
        <div className="branding-content">
          <AureoLogo />
          <h1 className="branding-headline">
            Welcome to Aureo
          </h1>
          <p className="branding-subhead">
            Manage More, Stress Less
          </p>
        </div>
      </section>

      {/* Login Form Section */}
      <section className="login-form-section">
        <div className="form-container">
          <div className="login-header">
            <h1>Sign In</h1>
            <p>Access your event management dashboard</p>  
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-alert">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 15h2v2h-2zm0-8h2v6h-2zm1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@yourcompany.com"  
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <button 
                type="button"
                className="forgot-password"
                onClick={() => setShowPasswordResetModal(true)}
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" />
                  Signing In...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="signup-prompt">
            New to Aureo?  
            <Link to="/signup" className="signup-link">
              Create account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}