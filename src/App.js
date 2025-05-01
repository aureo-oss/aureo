import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Clients } from './components/Clients';
import Templates from './components/Templates';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { Projects } from './Projects';
import PostEventAssistant from './components/PostEventAssistant';
import { Payments } from './Payments';
import Login from './auth/Login';
import Signup from './auth/Signup';
import AccountPage from './components/AccountPage';
import Contact from './components/Contact';
import HowToUse from './components/HowToUse';
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { 
  clearIndexedDbPersistence, 
  onSnapshot, 
  doc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from './firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { FiMenu, FiX, FiUsers, FiCalendar, FiMail, FiPhone } from 'react-icons/fi';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth] = useState(240);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    clients: [],
    projects: [],
    stats: {
      totalClients: 0,
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const dropdownTimeoutRef = useRef(null);
  const userMenuRef = useRef(null);

  useFirestoreConnectionMonitor();

  useEffect(() => {
    if (!currentUser) return;
  
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const clientsQuery = query(
          collection(db, "clients"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const clientsSnapshot = await getDocs(clientsQuery);
        const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
        const projectsQuery = query(
          collection(db, "projects"),
          where("userId", "==", currentUser.uid),
          orderBy("dueDate", "asc"),
          limit(5)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
        const totalClientsQuery = query(
          collection(db, "clients"),
          where("userId", "==", currentUser.uid)
        );
        const totalClientsSnapshot = await getDocs(totalClientsQuery);
        const totalClients = totalClientsSnapshot.size;
  
        const totalProjectsQuery = query(
          collection(db, "projects"),
          where("userId", "==", currentUser.uid)
        );
        const totalProjectsSnapshot = await getDocs(totalProjectsQuery);
        const totalProjects = totalProjectsSnapshot.size;
  
        const activeProjectsQuery = query(
          collection(db, "projects"),
          where("userId", "==", currentUser.uid),
          where("status", "==", "In Progress")
        );
        const activeProjectsSnapshot = await getDocs(activeProjectsQuery);
        const activeProjects = activeProjectsSnapshot.size;
  
        const completedProjectsQuery = query(
          collection(db, "projects"),
          where("userId", "==", currentUser.uid),
          where("status", "==", "Completed")
        );
        const completedProjectsSnapshot = await getDocs(completedProjectsQuery);
        const completedProjects = completedProjectsSnapshot.size;
  
        setDashboardData({
          clients: clientsData,
          projects: projectsData,
          stats: {
            totalClients,
            totalProjects,
            activeProjects,
            completedProjects
          }
        });
  
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchDashboardData();
  
    const unsubscribeClients = onSnapshot(
      query(
        collection(db, "clients"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      ),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDashboardData(prev => ({ ...prev, clients: data }));
      }
    );
  
    const unsubscribeProjects = onSnapshot(
      query(
        collection(db, "projects"),
        where("userId", "==", currentUser.uid),
        orderBy("dueDate", "asc"),
        limit(5)
      ),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDashboardData(prev => ({
          ...prev,
          projects: data
        }));
      }
    );
  
    return () => {
      unsubscribeClients();
      unsubscribeProjects();
    };
  }, [currentUser]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
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
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleUserMenuHover = () => {
    clearTimeout(dropdownTimeoutRef.current);
    setShowUserDropdown(true);
  };

  const handleUserMenuLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setShowUserDropdown(false);
    }, 5000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'account': return <ErrorBoundary><AccountPage setActiveTab={setActiveTab} /></ErrorBoundary>;
      case 'clients': return <ErrorBoundary><Clients /></ErrorBoundary>;
      case 'projects': return <ErrorBoundary><Projects /></ErrorBoundary>;
      case 'templates': return <ErrorBoundary><Templates /></ErrorBoundary>;
      case 'payments': return <ErrorBoundary><Payments /></ErrorBoundary>;
      case 'invoices': return <ErrorBoundary><InvoiceGenerator /></ErrorBoundary>;
      case 'post-event': return <ErrorBoundary><PostEventAssistant /></ErrorBoundary>;
      case 'contact': return <ErrorBoundary><Contact isMobile={isMobile} /></ErrorBoundary>;
      default: return (
        <div className="dashboard-container">
          <div className="dashboard-grid">
            {/* Left Column */}
            <div className="dashboard-left">
              {/* Welcome Card */}
              <div className="dashboard-card welcome-card">
                <div className="welcome-content">
                  <h2>Welcome back, {currentUser?.displayName || 'Event Manager'}!</h2>
                  <p>You have {dashboardData.stats.totalProjects} active events and {dashboardData.stats.totalClients} clients.</p>
                  <div className="welcome-stats">
                    <div className="stat-item">
                      <span className="stat-number">{dashboardData.stats.totalClients}</span>
                      <span className="stat-label">Clients</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{dashboardData.stats.totalProjects}</span>
                      <span className="stat-label">Projects</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{dashboardData.stats.completedProjects}</span>
                      <span className="stat-label">Completed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Setup Card */}
              <div className="dashboard-card setup-reminder">
                <div className="setup-content">
                  <h3>Account Setup Required</h3>
                  <p>
                    To access full system capabilities including invoice generation,
                    payment processing, and client management, please ensure your:
                  </p>
                  <ul className="setup-checklist">
                    <li>Business information is updated</li>
                    <li>Payment details are verified</li>
                    <li>Tax configuration is completed</li>
                  </ul>
                  <button 
                    onClick={() => setActiveTab('account')}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      width: '100%',
                      marginTop: '20px',
                      cursor: 'pointer',
                      ':hover': {
                        backgroundColor: '#fff',
                        color: '#000',
                        borderColor: '#fff'
                      }
                    }}
                  >
                    Complete Account Setup
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="dashboard-right">
              {/* Quick Actions */}
              <div className="dashboard-card quick-actions-card">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button 
                    onClick={() => setActiveTab('projects')}
                    className="action-button primary-action"
                  >
                    <span className="action-icon">📅</span>
                    <span>Create New Event</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('clients')}
                    className="action-button secondary-action"
                  >
                    <span className="action-icon">👥</span>
                    <span>Add New Client</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('invoices')}
                    className="action-button tertiary-action"
                  >
                    <span className="action-icon">💸</span>
                    <span>Generate Invoice</span>
                  </button>
                </div>
              </div>

              {/* Recent Clients */}
              <div className="dashboard-card clients-card">
                <div className="card-header">
                  <h3>Recent Clients</h3>
                  <button 
                    onClick={() => setActiveTab('clients')}
                    className="view-all-button"
                  >
                    View All
                  </button>
                </div>
                <div className="clients-list">
                  {dashboardData.clients.length > 0 ? (
                    dashboardData.clients.map(client => (
                      <div key={client.id} className="client-item">
                        <div className="client-avatar">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="client-details">
                          <h4>{client.name}</h4>
                          <p><FiMail /> {client.email || "Not provided"}</p>
                          <p><FiPhone /> {client.phone || "Not provided"}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>No recent clients</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="app-container">
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#1e1e1e',
          color: '#ffffff',
          border: '1px solid #2C2C2C',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }
      }} />
      
      {currentUser && (
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              {isMobile && (
                <button 
                  onClick={toggleSidebar} 
                  className="menu-toggle"
                  aria-label="Toggle menu"
                >
                  {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
              )}
              <div className="logo-wrapper">
                <img src={whiteLogo} alt="Sigma AI Logo" className="app-logo" />
                <h1 className="app-title">Aureo</h1>
              </div>
            </div>
            <div className="header-right">
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
                  <div className="dropdown-menu">
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
            <div className={`app-main ${isSidebarOpen ? 'sidebar-open' : ''}`}>
              <aside 
                className={`app-sidebar ${isSidebarOpen ? 'open' : ''} ${isMobile ? 'mobile-sidebar' : ''}`}
                style={{
                  transform: isMobile ? 
                    `translateX(${isSidebarOpen ? '0' : '-100%'})` : 'none'
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
                      { id: 'post-event', icon: 'M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 8V12L15 15', text: 'Aria' },
                      { id: 'contact', icon: 'M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4ZM19.252 6L12 11.284 4.748 6H19.252ZM4 18V6.714L12 12.716L20 6.714V18H4Z', text: 'Contact & Creators note' },
                    ].map((item) => (
                      <li 
                        key={item.id} 
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path 
                            d={item.icon} 
                            stroke={activeTab === item.id ? '#ffffff' : '#9ca3af'} 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                          />
                        </svg>
                        <span>
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
              <main 
                className="main-content"
                style={{
                  marginLeft: !isMobile && isSidebarOpen ? `${sidebarWidth}px` : '0',
                  width: !isMobile && isSidebarOpen ? `calc(100% - ${sidebarWidth}px)` : '100%',
                  transition: 'margin-left 0.3s ease'
                }}
              >
                <div className="content-container">
                  {isLoading ? (
                    <div className="loading-overlay">
                      <div className="loading-spinner"></div>
                    </div>
                  ) : (
                    renderContent()
                  )}
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
  return <AppContent />;
}