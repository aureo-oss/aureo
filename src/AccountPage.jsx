// src/pages/AccountPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { updateProfile, updateEmail } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import './AccountPage.css';

const AccountPage = () => {
  const { currentUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    upiId: '',
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    companyWebsite: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoURL, setPhotoURL] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        setFormData({
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          upiId: userData.upiId || '',
          companyName: userData.companyName || '',
          companyAddress: userData.companyAddress || '',
          companyEmail: userData.companyEmail || '',
          companyPhone: userData.companyPhone || '',
          companyWebsite: userData.companyWebsite || '',
        });

        if (currentUser.photoURL) {
          try {
            const img = new Image();
            img.src = currentUser.photoURL;
            img.onload = () => {
              setPhotoURL(currentUser.photoURL);
              setAvatarError(false);
            };
            img.onerror = () => setAvatarError(true);
          } catch (error) {
            console.error('Error checking avatar:', error);
            setAvatarError(true);
          }
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setPhotoURL(URL.createObjectURL(e.target.files[0]));
      setAvatarError(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const updates = {};
      let photoDownloadURL = currentUser.photoURL || '';

      if (photoFile) {
        const storageRef = ref(storage, `profile_pics/${currentUser.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoDownloadURL = await getDownloadURL(storageRef);
      }

      if (formData.displayName !== currentUser.displayName || photoDownloadURL !== currentUser.photoURL) {
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName,
          photoURL: photoDownloadURL
        });
        setPhotoURL(photoDownloadURL);
      }

      if (formData.email !== currentUser.email) {
        await updateEmail(auth.currentUser, formData.email);
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        upiId: formData.upiId,
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        companyEmail: formData.companyEmail,
        companyPhone: formData.companyPhone,
        companyWebsite: formData.companyWebsite,
        lastUpdated: new Date().toISOString()
      });

      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="account-container">
      <div className="account-header">
        <h2>Account Settings</h2>
        {!editMode && (
          <button className="edit-btn" onClick={() => setEditMode(true)}>
            Edit Profile
          </button>
        )}
      </div>

      <div className="profile-section">
        <div className="avatar-container">
          {photoURL && !avatarError ? (
            <img src={photoURL} alt="Profile" className="profile-avatar" />
          ) : (
            <div className="avatar-placeholder">
              {formData.displayName.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          {editMode && (
            <div className="avatar-upload">
              <label htmlFor="photo-upload" className="upload-btn">
                {photoURL ? 'Change Photo' : 'Add Photo'}
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Personal Information</label>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              disabled={!editMode}
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={!editMode}
            />
          </div>

          <div className="form-group">
            <label>Payment Information</label>
            <input
              type="text"
              placeholder="UPI ID"
              value={formData.upiId}
              onChange={(e) => setFormData({...formData, upiId: e.target.value})}
              disabled={!editMode}
              pattern="^[a-zA-Z0-9.-]+@[a-zA-Z]+$"
            />
          </div>

          <div className="form-group">
            <label>Company Information</label>
            <input
              type="text"
              placeholder="Company Name"
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              disabled={!editMode}
            />
            <input
              type="text"
              placeholder="Company Address"
              value={formData.companyAddress}
              onChange={(e) => setFormData({...formData, companyAddress: e.target.value})}
              disabled={!editMode}
            />
            <input
              type="email"
              placeholder="Company Email"
              value={formData.companyEmail}
              onChange={(e) => setFormData({...formData, companyEmail: e.target.value})}
              disabled={!editMode}
            />
            <input
              type="tel"
              placeholder="Company Phone"
              value={formData.companyPhone}
              onChange={(e) => setFormData({...formData, companyPhone: e.target.value})}
              disabled={!editMode}
            />
            <input
              type="url"
              placeholder="Company Website"
              value={formData.companyWebsite}
              onChange={(e) => setFormData({...formData, companyWebsite: e.target.value})}
              disabled={!editMode}
            />
          </div>

          {editMode && (
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={isUpdating}>
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