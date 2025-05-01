import React, { useState, useEffect } from 'react';
import { Instagram } from 'react-feather';
import founderImage from './founder-image.jpg';

const Contact = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? '1rem' : '2rem 1rem',
    },
    heading: {
      fontSize: isMobile ? '1.75rem' : '2rem',
      fontWeight: '600',
      marginBottom: '1.5rem',
      color: 'var(--text-primary)',
    },
    supportSection: {
      marginBottom: '2rem',
    },
    section: {
      borderRadius: '12px',
      padding: isMobile ? '1rem' : '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      marginBottom: isMobile ? '1rem' : '2rem',
    },
    gridContainer: {
      display: 'grid',
      gap: isMobile ? '1rem' : '2rem',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
    },
    imageWrapper: {
      position: 'relative',
      borderRadius: '8px',
      overflow: 'hidden',
      aspectRatio: '1/1',
      maxWidth: isMobile ? '100%' : '400px',
      margin: '0 auto',
    },
    founderInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    },
    contactItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: 'var(--text-secondary)',
    },
    socialLinks: {
      display: 'flex',
      gap: '1rem',
      marginTop: isMobile ? '1rem' : '1.5rem',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Contact Us</h1>

      <div style={styles.supportSection}>
        <h2
          style={{
            ...styles.heading,
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            color: '#1a1a1a',
          }}
        >
          Customer Support
        </h2>
        <p
          style={{
            color: '#4a5568',
            lineHeight: '1.6',
            fontSize: isMobile ? '0.875rem' : '1rem',
          }}
        >
          Our dedicated support team is available 24/7 to assist you with any inquiries
          or technical issues. We guarantee a response within 4 business hours.
        </p>
        <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
          <div style={styles.contactItem}>
            <span>📧</span>
            <a
              href="mailto:support@aureo.com"
              style={{ color: '#4f46e5', textDecoration: 'none' }}
            >
              support@aureo.com
            </a>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={{ ...styles.heading, fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
          About the Founder
        </h2>
        <div style={styles.gridContainer}>
          <div style={styles.imageWrapper}>
            <img
              src={founderImage}
              alt="Adithyan Lalu, Founder & CEO"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={styles.founderInfo}>
            <h3
              style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
              }}
            >
              Adhy
            </h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontWeight: '500',
                fontSize: isMobile ? '0.875rem' : '1rem',
              }}
            >
              <strong>Founder & CEO | Aerospace Engineering Student | Recognized
              Wildlife Photographer & Filmmaker</strong>
            </p>
            <p
              style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                fontSize: isMobile ? '0.875rem' : '1rem',
              }}
            >
              I am Adithyan Lalu, an aerospace engineering student at Amrita School of
              Engineering and founder of my own venture. Driven by an adventurous spirit,
              I balance rigorous academic work with wildlife photography—recognized by
              Canon India—and filmmaking, with short films screened at film festivals. These
              experiences have sharpened my attention to detail and reinforced a disciplined,
              quality-driven approach. I bring that same adventurous curiosity and methodical
              mindset to every project I lead.
            </p>
            <div style={styles.socialLinks}>
              <a
                href="https://instagram.com/lensof_adhyyy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ transition: 'opacity 0.2s' }}
              >
                <Instagram size={isMobile ? 20 : 24} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;