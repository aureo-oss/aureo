import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './VerificationPending.css';

export default function VerificationPending() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="verification-container">
      <div className="verification-card">
        <h2>🎉 Almost There!</h2>
        <div className="verification-icon">✉️</div>
        <p>We've sent a verification email to your inbox</p>
        <p className="highlight-text">Please click the verification link to activate your account</p>
        <p className="redirect-text">You'll be redirected to login in 10 seconds...</p>
        <div className="support-text">
          Didn't receive the email? Check spam or 
          <a href="/resend-verification">Resend Verification</a>
        </div>
      </div>
    </div>
  );
}