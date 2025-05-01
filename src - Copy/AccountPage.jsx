import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { updateProfile, updateEmail } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../firebase';
import { toast } from 'react-hot-toast';
import './AccountPage.css';

const AccountPage = () => {
  const { currentUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoURL, setPhotoURL] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      setPhotoURL(currentUser.photoURL || '');
    }
  }, [currentUser]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setPhotoURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const updates = {};
      let photoDownloadURL = photoURL;

      // Upload new photo if selected
      if (photoFile) {
        const storageRef = ref(storage, `profile_pics/${currentUser.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoDownloadURL = await getDownloadURL(storageRef);
      }

      // Update profile if name or photo changed
      if (displayName !== currentUser.displayName || photoDownloadURL !== currentUser.photoURL) {
        updates.photoURL = photoDownloadURL;
        updates.displayName = displayName;
        await updateProfile(auth.currentUser, updates);
      }

      // Update email if changed
      if (email !== currentUser.email) {
        await updateEmail(auth.currentUser, email);
      }

      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      toast.error(`Update failed: ${error.message}`);
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="account-container">
      <div className="account-header">
        <h2>My Profile</h2>
        {!editMode && (
          <button 
            className="edit-btn"
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="profile-section">
        <div className="avatar-container">
          {photoURL ? (
            <img 
              src={photoURL} 
              alt="Profile" 
              className="profile-avatar"
            />
          ) : (
            <div className="avatar-placeholder">
              {displayName.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          {editMode && (
            <div className="avatar-upload">
              <label htmlFor="photo-upload" className="upload-btn">
                Change Photo
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Name</label>
            {editMode ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            ) : (
              <div className="profile-info">{displayName || 'Not set'}</div>
            )}
          </div>

          <div className="form-group">
            <label>Email</label>
            {editMode ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            ) : (
              <div className="profile-info">{email}</div>
            )}
          </div>

          <div className="form-group">
            <label>Account Created</label>
            <div className="profile-info">
              {new Date(currentUser.metadata.creationTime).toLocaleDateString()}
            </div>
          </div>

          <div className="form-group">
            <label>Last Login</label>
            <div className="profile-info">
              {new Date(currentUser.metadata.lastSignInTime).toLocaleString()}
            </div>
          </div>

          {editMode && (
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setEditMode(false);
                  setDisplayName(currentUser.displayName || '');
                  setEmail(currentUser.email || '');
                  setPhotoURL(currentUser.photoURL || '');
                }}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="save-btn"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AccountPage;