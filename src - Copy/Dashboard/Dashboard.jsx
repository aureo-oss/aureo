import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { CustomBarChart, CustomPieChart } from './Charts';
import './Dashboard.css';

export function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [revenue, setRevenue] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [eventStatus, setEventStatus] = useState({});
  const [eventTypes, setEventTypes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeInvoices = onSnapshot(
      query(collection(db, "invoices"), where("userId", "==", currentUser.uid)),
      (snapshot) => {
        const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
        setRevenue(total);
        setLoading(false);
      }
    );

    const unsubscribeClients = onSnapshot(
      query(collection(db, "clients"), where("userId", "==", currentUser.uid)),
      (snapshot) => {
        setClientCount(snapshot.size);
        
        // Dynamically count event types
        const types = {};
        snapshot.forEach((doc) => {
          const type = doc.data().eventType || 'other';
          types[type] = (types[type] || 0) + 1;
        });
        setEventTypes(types);
      }
    );

    const unsubscribeEvents = onSnapshot(
      query(collection(db, "events"), where("userId", "==", currentUser.uid)),
      (snapshot) => {
        const statusCounts = {};
        snapshot.forEach((doc) => {
          const status = doc.data().status || 'pending';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        setEventStatus(statusCounts);
      }
    );

    return () => {
      unsubscribeInvoices();
      unsubscribeClients();
      unsubscribeEvents();
    };
  }, [currentUser]);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  // Prepare chart data dynamically
  const eventStatusData = Object.entries(eventStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: getColorForStatus(name)
  }));

  const eventTypesData = Object.entries(eventTypes).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: getColorForType(name)
  }));

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Event Management Dashboard</h1>
        <div className="header-actions">
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <h2>Performance Overview</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p>${revenue.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Client Count</h3>
            <p>{clientCount}</p>
          </div>
          <div className="stat-card">
            <h3>Active Events</h3>
            <p>{eventStatus.active || 0}</p>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-container">
            <h3>Events by Status</h3>
            <CustomPieChart data={eventStatusData} />
          </div>

          <div className="chart-container">
            <h3>Events by Type</h3>
            <CustomBarChart data={eventTypesData} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for dynamic coloring
function getColorForStatus(status) {
  const colors = {
    pending: '#FFB347',
    active: '#77DD77',
    completed: '#6495ED',
    cancelled: '#FF6961',
    default: '#A4B0BD'
  };
  return colors[status.toLowerCase()] || colors.default;
}

function getColorForType(type) {
  // This can be expanded with specific colors for known event types
  const colors = [
    '#FF6961', '#FDFD96', '#84B6F4', '#77DD77', 
    '#FFB347', '#B39EB5', '#CB99C9', '#AEC6CF'
  ];
  const index = Math.abs(hashCode(type)) % colors.length;
  return colors[index];
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}