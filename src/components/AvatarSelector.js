// components/AvatarSelector.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const AvatarSelector = ({ name, onSelect, currentAvatar }) => {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateAvatars = () => {
      if (!name) return;
      
      setLoading(true);
      
      // Generate random avatar URLs based on the user's name
      const baseUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=';
      const avatarOptions = [];
      
      // Create 6 avatar options using different seeds based on the name
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
      <h3>Choose Your Avatar</h3>
      {loading ? (
        <div className="loading-avatars">Generating avatars...</div>
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
                alt="Avatar option" 
                className="avatar-image"
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

export default AvatarSelector;