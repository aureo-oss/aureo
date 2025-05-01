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
          // Get auth profile data
          const authData = {
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            phone: currentUser.phoneNumber || '',
            photoURL: currentUser.photoURL || ''
          };

          // Get additional data from Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const firestoreData = userDoc.exists() ? userDoc.data() : {};

          setFormData({
            ...authData,
            ...firestoreData,
            location: firestoreData.location || {
              address: '',
              coordinates: null,
              timezone: ''
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
          
          // Using OpenStreetMap Nominatim API (free, no key required)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error.message || 'Failed to get address');
          }

          setFormData(prev => ({
            ...prev,
            location: {
              address: data.display_name || '',
              coordinates: { lat: latitude, lng: longitude },
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          }));
        } catch (error) {
          console.error('Location detection error:', error);
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
    setFormData(prev => ({
      ...prev,
      photoURL: url
    }));
    setShowAvatarSelector(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      // Reauthenticate if changing email
      if (formData.email !== currentUser.email) {
        if (!password) {
          throw new Error('Please enter your password to change email');
        }
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          password
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // Prepare updates
      const updates = {
        displayName: formData.displayName,
        phone: formData.phone,
        photoURL: formData.photoURL,
        location: formData.location,
        updatedAt: new Date()
      };

      // Update auth profile
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName,
        photoURL: formData.photoURL
      });

      // Update email if changed
      if (formData.email !== currentUser.email) {
        await updateEmail(auth.currentUser, formData.email);
      }

      // Update Firestore document
      await updateDoc(doc(db, 'users', currentUser.uid), updates);

      toast.success('Profile updated successfully!');
      setEditMode(false);
      setPassword('');
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Update error:', error);
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
            <button 
              className="btn edit-btn"
              onClick={() => setEditMode(true)}
            >
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
                {editMode ? (
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                    disabled={isUpdating}
                  />
                ) : (
                  <div className="profile-info">
                    {formData.displayName || 'Not set'}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Email</label>
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isUpdating}
                  />
                ) : (
                  <div className="profile-info">{formData.email}</div>
                )}
              </div>

              {editMode && formData.email !== currentUser.email && (
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
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isUpdating}
                    placeholder="+1234567890"
                  />
                ) : (
                  <div className="profile-info">
                    {formData.phone || 'Not set'}
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3>Location Information</h3>
              {editMode ? (
                <>
                  <div className="form-group">
                    <label>Address</label>
                    <div className="location-input-group">
                      <input
                        type="text"
                        value={formData.location.address}
                        onChange={handleLocationChange}
                        disabled={isUpdating}
                        placeholder="Enter your address"
                      />
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={isDetectingLocation || isUpdating}
                        className="btn location-detect-btn"
                      >
                        {isDetectingLocation ? (
                          <>
                            <span className="loading-spinner small white"></span>
                            Detecting...
                          </>
                        ) : 'Detect Location'}
                      </button>
                    </div>
                  </div>
                  {locationError && (
                    <div className="error-message">
                      {locationError}
                    </div>
                  )}
                  {formData.location.timezone && (
                    <div className="timezone-info">
                      <strong>Detected Timezone:</strong> {formData.location.timezone}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="profile-info">
                    {formData.location.address || 'Not set'}
                  </div>
                  {formData.location.timezone && (
                    <div className="timezone-info">
                      <strong>Timezone:</strong> {formData.location.timezone}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="form-section">
              <h3>Account Information</h3>
              
              <div className="form-group">
                <label>User ID</label>
                <div className="profile-info monospace">
                  {currentUser?.uid || 'N/A'}
                </div>
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
                <button
                  type="submit"
                  className="btn save-btn"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <span className="loading-spinner small white"></span>
                      Saving...
                    </>
                  ) : 'Save Changes'}
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