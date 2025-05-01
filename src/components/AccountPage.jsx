import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { toast } from 'react-hot-toast';
import './AccountPage.css';
import { User } from 'react-feather';

const AvatarSelector = ({ name, onSelect, currentAvatar }) => {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateAvatars = () => {
      if (!name) return;
      
      setLoading(true);
      const baseUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=';
      const avatarOptions = [];
      
      for (let i = 0; i < 6; i++) {
        const seed = `${name}-${i}-${Math.random().toString(36).substring(2, 8)}`;
        avatarOptions.push({
          id: seed,
          url: `${baseUrl}${seed}&backgroundColor=65c9ff,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
        });
      }
      
      setAvatars(avatarOptions);
      setLoading(false);
    };

    generateAvatars();
  }, [name]);

  return (
    <div className="avatar-selector">
      <h4>Choose an Avatar</h4>
      {loading ? (
        <div className="loading-spinner small"></div>
      ) : (
        <div className="avatar-grid">
          {avatars.map((avatar) => (
            <div 
              key={avatar.id}
              className={`avatar-option ${currentAvatar === avatar.url ? 'selected' : ''}`}
              onClick={() => onSelect(avatar.url)}
            >
              <img 
                src={avatar.url} 
                alt="Avatar" 
                className="avatar-img"
                onError={(e) => {
                  e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback&backgroundColor=b6e3f4';
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AccountPage = ({ darkMode = false, setActiveTab }) => {
  const { currentUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    photoURL: '',
    location: {
      address: '',
      coordinates: null,
      timezone: ''
    },
    company: {
      name: '',
      address: '',
      email: '',
      phone: '',
      website: '',
      taxId: '',
      paymentTerms: 'Net 30 Days'
    },
    billing: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
      swiftCode: ''
    }
  });
  const [password, setPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};

          setFormData({
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            phone: currentUser.phoneNumber || '',
            photoURL: currentUser.photoURL || '',
            location: userData.location || {
              address: '',
              coordinates: null,
              timezone: ''
            },
            company: userData.company || {
              name: '',
              address: '',
              email: '',
              phone: '',
              website: '',
              taxId: '',
              paymentTerms: 'Net 30 Days'
            },
            billing: userData.billing || {
              bankName: '',
              accountNumber: '',
              ifscCode: '',
              upiId: '',
              swiftCode: ''
            }
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Failed to load profile data');
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data.error) throw new Error(data.error.message);

          setFormData(prev => ({
            ...prev,
            location: {
              address: data.display_name || '',
              coordinates: { lat: latitude, lng: longitude },
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          }));
        } catch (error) {
          setLocationError(error.message || 'Failed to detect location');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setLocationError(`Geolocation error: ${error.message}`);
        setIsDetectingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  const handleAvatarSelect = (url) => {
    setFormData(prev => ({ ...prev, photoURL: url }));
    setShowAvatarSelector(false);
  };

  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const pathParts = path.split('.');
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      
      current[pathParts[pathParts.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      if (formData.email !== currentUser.email && !password) {
        throw new Error('Please enter your password to change email');
      }

      if (formData.email !== currentUser.email) {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      await updateProfile(auth.currentUser, {
        displayName: formData.displayName,
        photoURL: formData.photoURL
      });

      if (formData.email !== currentUser.email) {
        await updateEmail(auth.currentUser, formData.email);
      }

      const updates = {
        displayName: formData.displayName,
        phone: formData.phone,
        photoURL: formData.photoURL,
        location: formData.location,
        company: formData.company,
        billing: formData.billing,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', currentUser.uid), updates);

      toast.success('Profile updated successfully!');
      setEditMode(false);
      setPassword('');
      setActiveTab('dashboard');
    } catch (error) {
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`account-page ${darkMode ? 'dark' : ''}`}>
      <div className="account-container">
        <div className="account-header">
          <h2>My Profile</h2>
          {!editMode ? (
            <button className="btn edit-btn" onClick={() => setEditMode(true)}>
              Edit Profile
            </button>
          ) : (
            <button 
              className="btn cancel-btn"
              onClick={() => {
                setEditMode(false);
                setPassword('');
                setLocationError('');
                setShowAvatarSelector(false);
              }}
              disabled={isUpdating}
            >
              Cancel
            </button>
          )}
        </div>

        <div className="account-content">
          <div className="profile-picture-section">
            <div className="avatar-container">
              {formData.photoURL ? (
                <img 
                  src={formData.photoURL} 
                  alt="Profile" 
                  className="profile-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                    setFormData(prev => ({ ...prev, photoURL: '' }));
                  }}
                />
              ) : (
                <div className="default-avatar">
                  {formData.displayName.charAt(0).toUpperCase() || <User size={24} />}
                </div>
              )}
            </div>
            
            {editMode && (
              <button
                className="btn avatar-btn"
                onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                disabled={isUpdating}
              >
                {showAvatarSelector ? 'Hide Avatars' : 'Change Avatar'}
              </button>
            )}
          </div>

          {editMode && showAvatarSelector && (
            <AvatarSelector 
              name={formData.displayName} 
              onSelect={handleAvatarSelect} 
              currentAvatar={formData.photoURL}
            />
          )}

          <form onSubmit={handleSubmit} className="account-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  disabled={!editMode || isUpdating}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!editMode || isUpdating}
                  required
                />
              </div>
              {editMode && formData.email !== currentUser?.email && (
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Required for email changes"
                    disabled={isUpdating}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!editMode || isUpdating}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Company Information</h3>
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  value={formData.company.name}
                  onChange={(e) => handleInputChange('company.name', e.target.value)}
                  disabled={!editMode || isUpdating}
                />
              </div>
              <div className="form-group">
                <label>Company Address</label>
                <textarea
                  value={formData.company.address}
                  onChange={(e) => handleInputChange('company.address', e.target.value)}
                  disabled={!editMode || isUpdating}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Tax ID</label>
                <input
                  type="text"
                  value={formData.company.taxId}
                  onChange={(e) => handleInputChange('company.taxId', e.target.value)}
                  disabled={!editMode || isUpdating}
                />
              </div>
              <div className="form-group">
                <label>Payment Terms</label>
                <select
                  value={formData.company.paymentTerms}
                  onChange={(e) => handleInputChange('company.paymentTerms', e.target.value)}
                  disabled={!editMode || isUpdating}
                >
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <h3>Billing Information</h3>
              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  value={formData.billing.bankName}
                  onChange={(e) => handleInputChange('billing.bankName', e.target.value)}
                  disabled={!editMode || isUpdating}
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  value={formData.billing.accountNumber}
                  onChange={(e) => handleInputChange('billing.accountNumber', e.target.value)}
                  disabled={!editMode || isUpdating}
                />
              </div>
              <div className="form-group">
                <label>UPI ID</label>
                <input
                  type="text"
                  value={formData.billing.upiId}
                  onChange={(e) => handleInputChange('billing.upiId', e.target.value)}
                  disabled={!editMode || isUpdating}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Location Information</h3>
              <div className="form-group">
                <label>Address</label>
                <div className="location-input-group">
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => handleInputChange('location.address', e.target.value)}
                    disabled={!editMode || isUpdating}
                  />
                  {editMode && (
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={isDetectingLocation || isUpdating}
                      className="btn location-detect-btn"
                    >
                      {isDetectingLocation ? 'Detecting...' : 'Auto-Detect'}
                    </button>
                  )}
                </div>
              </div>
              {formData.location.timezone && (
                <div className="timezone-info">
                  <strong>Timezone:</strong> {formData.location.timezone}
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Account Information</h3>
              <div className="form-group">
                <label>User ID</label>
                <div className="profile-info monospace">{currentUser?.uid}</div>
              </div>
              <div className="form-group">
                <label>Account Created</label>
                <div className="profile-info">
                  {currentUser?.metadata?.creationTime ? 
                    new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 
                    'N/A'}
                </div>
              </div>
              <div className="form-group">
                <label>Last Login</label>
                <div className="profile-info">
                  {currentUser?.metadata?.lastSignInTime ? 
                    new Date(currentUser.metadata.lastSignInTime).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 
                    'N/A'}
                </div>
              </div>
            </div>

            {editMode && (
              <div className="form-actions">
                <button type="submit" className="btn save-btn" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;