import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import './VerifyEmail.css';

export default function VerifyEmail() {
  const { currentUser, sendVerification } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!currentUser) navigate('/login');
    if (currentUser?.emailVerified) navigate('/dashboard');
  }, [currentUser, navigate]);

  async function handleResend() {
    try {
      setLoading(true);
      setError('');
      await sendVerification();
      setSuccess('Verification email resent successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="verify-container">
      <h2>Verify Your Email Address</h2>
      <div className="verify-content">
        <p>We've sent a verification email to:</p>
        <p className="verify-email">{currentUser?.email}</p>
        <p>Check your inbox and click the verification link to activate your account.</p>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <button 
          onClick={handleResend} 
          disabled={loading}
          className="resend-button"
        >
          {loading ? 'Sending...' : 'Resend Verification Email'}
        </button>

        <p className="check-spam">
          Didn't receive it? Check your spam folder or<br/>
          contact support at help@sigmasuite.com
        </p>
      </div>
    </div>
  );
}