import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Clients } from './components/Clients';
import Templates from './components/Templates';
import { InvoiceGenerator } from './InvoiceGenerator';
import { Projects } from './Projects';
import PostEventAssistant from './components/PostEventAssistant';
import { Payments } from './Payments';
import { Login } from './auth/Login';
import Signup from './auth/Signup';
import AccountPage from './components/AccountPage';
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { clearIndexedDbPersistence, onSnapshot, doc } from 'firebase/firestore';
import { db } from './firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { Moon, Sun, Menu, X } from 'react-feather';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import whiteLogo from './sigma-logo-white.svg';

function useFirestoreConnectionMonitor() {
  useEffect(() => {
    let unsubscribe;
    let retryCount = 0;
    const maxRetries = 3;

    const setupConnectionMonitor = () => {
      try {
        unsubscribe = onSnapshot(doc(db, 'connection', 'monitor'),
          () => {},
          (error) => {
            console.error('Firestore connection error:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(setupConnectionMonitor, 2000 * retryCount);
            }
          }
        );
      } catch (error) {
        console.error('Error setting up connection monitor:', error);
      }
    };

    setupConnectionMonitor();
    return () => unsubscribe && unsubscribe();
  }, []);
}

function AppContent() {
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth] = useState(240);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownTimeoutRef = useRef(null);
  const userMenuRef = useRef(null);

  useFirestoreConnectionMonitor();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const handleUserMenuHover = () => {
    clearTimeout(dropdownTimeoutRef.current);
    setShowUserDropdown(true);
  };

  const handleUserMenuLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setShowUserDropdown(false);
    }, 5000); // 5 second timeout
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'account': return <ErrorBoundary><AccountPage darkMode={darkMode} setActiveTab={setActiveTab} /></ErrorBoundary>;
      case 'clients': return <ErrorBoundary><Clients /></ErrorBoundary>;
      case 'projects': return <ErrorBoundary><Projects /></ErrorBoundary>;
      case 'templates': return <ErrorBoundary><Templates /></ErrorBoundary>;
      case 'payments': return <ErrorBoundary><Payments /></ErrorBoundary>;
      case 'invoices': return <ErrorBoundary><InvoiceGenerator /></ErrorBoundary>;
      case 'post-event': return <ErrorBoundary><PostEventAssistant /></ErrorBoundary>;
      default: return (
        <div className={`dashboard-grid ${darkMode ? 'dark' : 'light'}`}>
          <div className={`welcome-card ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={darkMode ? 'text-white' : 'text-gray-900'}>Welcome back, {currentUser?.displayName || 'Event Manager'}!</h2>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Manage your events efficiently with our comprehensive tools</p>
          </div>
          
          <div className={`quick-actions-container ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="quick-actions">
              <h3 className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  onClick={() => setActiveTab('projects')}
                  className={`action-button ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'}`}
                >
                  Create New Event
                </button>
                <button 
                  onClick={() => setActiveTab('clients')}
                  className={`action-button ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-100 hover:bg-green-200 text-green-800'}`}
                >
                  Add New Client
                </button>
                <button 
                  onClick={() => setActiveTab('templates')}
                  className={`action-button ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-100 hover:bg-purple-200 text-purple-800'}`}
                >
                  Manage Templates
                </button>
              </div>
            </div>
          </div>

          <div className={`dashboard-feature-container ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="dashboard-feature-content">
              <div className="dashboard-feature-text">
                <h3 className={darkMode ? 'text-white' : 'text-gray-900'}>Event Management Made Simple</h3>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Our platform helps you manage all aspects of your events in one place. 
                  From client communication to invoicing, we've got you covered.
                </p>
              </div>
              <div className="dashboard-feature-image">
                <img 
                  src="https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                  alt="Event Management" 
                  className="feature-image"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: darkMode ? '#1e1e1e' : '#fff',
          color: darkMode ? '#fff' : '#1e1e1e',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }
      }} />
      
      {currentUser && (
        <header className={`app-header ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="header-content">
            <div className="header-left">
              {isMobile && (
                <button 
                  onClick={toggleSidebar} 
                  className="menu-toggle"
                  aria-label="Toggle menu"
                >
                  {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
              <div className="logo-wrapper">
                <img src={whiteLogo} alt="Sigma AI Logo" className="app-logo" />
                <h1 className={`app-title ${darkMode ? 'text-white' : 'text-gray-900'}`}>Aureo</h1>
              </div>
            </div>
            <div className="header-right">
              <button 
                onClick={toggleDarkMode} 
                className="theme-toggle"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div 
                className="user-menu-container"
                ref={userMenuRef}
                onMouseEnter={handleUserMenuHover}
                onMouseLeave={handleUserMenuLeave}
              >
                <button 
                  className="profile-icon-button"
                  aria-label="User menu"
                >
                  {currentUser?.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="profile-icon-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '';
                        e.target.parentElement.innerHTML = currentUser?.displayName?.charAt(0).toUpperCase();
                      }}
                    />
                  ) : (
                    <span className="profile-icon-fallback">
                      {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </button>
                {showUserDropdown && (
                  <div className={`dropdown-menu ${darkMode ? 'dark' : ''}`}>
                    <button 
                      onClick={() => {
                        setActiveTab('account');
                        setShowUserDropdown(false);
                      }}
                      className="dropdown-item"
                    >
                      Account Settings
                    </button>
                    <button 
                      onClick={logout} 
                      className="dropdown-item"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={
          currentUser ? (
            <div className="app-main">
              <aside 
                className={`app-sidebar ${isSidebarOpen ? 'open' : ''} ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{
                  display: isMobile ? (isSidebarOpen ? 'block' : 'none') : 'block'
                }}
              >
                <nav className="sidebar-nav">
                  <ul>
                    {[
                      { id: 'dashboard', icon: 'M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9ZM9 22V12H15V22', text: 'Dashboard' },
                      { id: 'clients', icon: 'M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11ZM23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88', text: 'Clients' },
                      { id: 'projects', icon: 'M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9ZM9 22V12H15V22', text: 'Events' },
                      { id: 'templates', icon: 'M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21ZM9 10H7V12H9V10ZM13 10H11V12H13V10ZM17 10H15V12H17V10ZM9 14H7V16H9V14ZM13 14H11V16H13V14ZM17 14H15V16H17V14ZM9 18H7V20H9V18ZM13 18H11V20H13V18ZM17 18H15V20H17V18Z', text: 'Templates' },
                      { id: 'payments', icon: 'M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7ZM16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21', text: 'Payments' },
                      { id: 'invoices', icon: 'M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2ZM14 2V8H20M16 13H8M16 17H8M10 9H9H8', text: 'Invoices' },
                      { id: 'post-event', icon: 'M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 8V12L15 15', text: 'AI Assistant' }
                    ].map((item) => (
                      <li 
                        key={item.id} 
                        className={`nav-item ${activeTab === item.id ? 'active' : ''} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        onClick={() => setActiveTab(item.id)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path 
                            d={item.icon} 
                            stroke={activeTab === item.id ? (darkMode ? '#818cf8' : '#6366f1') : (darkMode ? '#9ca3af' : '#6b7280')} 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                          />
                        </svg>
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
              <main 
                className={`main-content ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                style={{
                  marginLeft: !isMobile && isSidebarOpen ? `${sidebarWidth}px` : '0',
                  width: !isMobile && isSidebarOpen ? `calc(100% - ${sidebarWidth}px)` : '100%'
                }}
              >
                <div className="content-container">
                  {renderContent()}
                </div>
              </main>
            </div>
          ) : <Navigate to="/login" replace />
        } />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}