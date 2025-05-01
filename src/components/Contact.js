import React, { useState, useEffect } from 'react';
import { Instagram, Mail, Clock, Award, Film, Briefcase } from 'react-feather';
import founderImage from './founder-image.jpg';

const Contact = ({ isMobile }) => {
  return (
    <div className="contact-luxury">
      <div className="luxury-header">
        <h1>Connect With Us</h1>
        <p className="luxury-subtitle">Where innovation meets excellence</p>
        <div className="luxury-divider"></div>
      </div>

      <div className="luxury-support-card">
        <div className="support-header">
          <div className="support-icon">
            <Clock size={24} />
          </div>
          <h2>Customer Support</h2>
        </div>
        <p className="support-text">
          Our concierge-level support team is available to provide white-glove service for all your inquiries.
          Expect a response within 2 business hours.
        </p>
        <div className="support-contact-email">
          <Mail size={18} />
          <a href="mailto:aureoeventsmanagementteam@gmail.com" className="email-text-link">
            aureoeventsmanagementteam@gmail.com
          </a>
        </div>
      </div>

      <div className="luxury-founder-section">
        <div className="section-header">
          <h2>The Visionary</h2>
          <p className="section-subtitle">Meet the mind behind the innovation</p>
        </div>

        <div className="founder-profile">
          <div className="founder-image-container">
            <div className="image-frame">
              <img 
                src={founderImage} 
                alt="Adithyan Lalu, Founder & CEO" 
                className="founder-image"
              />
            </div>
            <div className="social-badge">
              <a href="https://instagram.com/lensof_adhyyy" target="_blank" rel="noopener noreferrer">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div className="founder-details">
            <h3 className="founder-name">Adithyan Lalu</h3>
            <div className="title-badge">
              <div className="badge-item">
                <Briefcase size={16} />
                <span>Founder & CEO</span>
              </div>
              <div className="badge-item">
                <Award size={16} />
                <span>Wildlife Photographer</span>
              </div>
              <div className="badge-item">
                <Film size={16} />
                <span>Filmmaker</span>
              </div>
            </div>

            <div className="founder-bio">
              <p>
                Aerospace engineering student at Amrita School of Engineering with a passion for pushing boundaries.
                Recognized by Canon India for wildlife photography and celebrated at film festivals for cinematic storytelling.
              </p>
              <p>
                My multidisciplinary approach blends technical precision with creative vision, bringing unparalleled attention
                to detail and a commitment to excellence in every endeavor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = `
.contact-luxury {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
  color: #e2e8f0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.luxury-header {
  text-align: center;
  margin-bottom: 4rem;
}

.luxury-header h1 {
  font-size: 2.75rem;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 0.75rem;
  letter-spacing: -0.5px;
}

.luxury-subtitle {
  font-size: 1.25rem;
  color: #94a3b8;
  font-weight: 400;
  margin-bottom: 1.5rem;
}

.luxury-divider {
  width: 80px;
  height: 4px;
  background: #4285F4;
  margin: 0 auto;
  border-radius: 2px;
}

.luxury-support-card {
  background: #121212;
  border-radius: 16px;
  padding: 2.5rem;
  margin-bottom: 4rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  border: 1px solid #3c4043;
  position: relative;
  overflow: hidden;
}

.luxury-support-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #4285F4;
}

.support-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.support-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(251, 188, 4, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.support-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #f8fafc;
}

.support-text {
  color: #cbd5e1;
  line-height: 1.7;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  max-width: 600px;
}

.support-contact-email {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #cbd5e1;
}

.email-text-link {
  color: #4285F4;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.email-text-link:hover {
  color: #5a9cff;
  text-decoration: underline;
}

.luxury-founder-section {
  background: #121212;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  border: 1px solid #3c4043;
}

.section-header {
  margin-bottom: 3rem;
  text-align: center;
}

.section-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 0.5rem;
}

.section-subtitle {
  font-size: 1.1rem;
  color: #94a3b8;
  font-weight: 400;
}

.founder-profile {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
  align-items: center;
}

.founder-image-container {
  position: relative;
}

.image-frame {
  width: 100%;
  padding-bottom: 100%;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.founder-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.9);
}

.social-badge {
  position: absolute;
  bottom: -1rem;
  right: -1rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #202124;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  border: 1px solid #3c4043;
  z-index: 10;
  transition: transform 0.3s ease;
}

.social-badge:hover {
  transform: scale(1.1);
}

.social-badge a {
  color: #FBBC04;
}

.founder-details {
  display: flex;
  flex-direction: column;
}

.founder-name {
  font-size: 2rem;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 1.5rem;
  letter-spacing: -0.5px;
}

.title-badge {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(66, 133, 244, 0.1);
  border-radius: 8px;
  color: #4285F4;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid #3c4043;
}

.founder-bio {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: #cbd5e1;
  line-height: 1.7;
  font-size: 1.1rem;
}

.founder-bio p {
  margin: 0;
}

@media (max-width: 768px) {
  .contact-luxury {
    padding: 2rem 1.5rem;
  }
  
  .luxury-header h1 {
    font-size: 2rem;
  }
  
  .luxury-subtitle {
    font-size: 1.1rem;
  }
  
  .luxury-support-card,
  .luxury-founder-section {
    padding: 1.75rem;
  }
  
  .founder-profile {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .image-frame {
    max-width: 300px;
    margin: 0 auto;
  }
  
  .founder-name {
    font-size: 1.75rem;
    text-align: center;
  }
  
  .title-badge {
    justify-content: center;
  }
  
  .section-header {
    margin-bottom: 2rem;
  }
}
`;

const ContactWrapper = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <style>{styles}</style>
      <Contact isMobile={isMobile} />
    </>
  );
};

export default ContactWrapper;