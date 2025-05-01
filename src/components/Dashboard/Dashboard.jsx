// src/components/Dashboard/Dashboard.jsx
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";
import { CustomBarChart, CustomPieChart } from "./Charts"; // Updated imports

export function Dashboard() {
  const [earnings, setEarnings] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [projectStatus, setProjectStatus] = useState({ pending: 0, active: 0, delivered: 0 });
  const [clientTypes, setClientTypes] = useState({ wedding: 0, portrait: 0, commercial: 0 });

  useEffect(() => {
    const unsubscribeInvoices = onSnapshot(collection(db, "invoices"), (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
      setEarnings(total);
    });

    const unsubscribeClients = onSnapshot(collection(db, "clients"), (snapshot) => {
      setClientCount(snapshot.size);
      const types = { wedding: 0, portrait: 0, commercial: 0 };
      snapshot.forEach((doc) => {
        const type = doc.data().type?.toLowerCase() || "wedding";
        types[type] = (types[type] || 0) + 1;
      });
      setClientTypes(types);
    });

    const unsubscribeProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
      const status = { pending: 0, active: 0, delivered: 0 };
      snapshot.forEach((doc) => {
        const s = doc.data().status?.toLowerCase() || "pending";
        status[s] = (status[s] || 0) + 1;
      });
      setProjectStatus(status);
    });

    return () => {
      unsubscribeInvoices();
      unsubscribeClients();
      unsubscribeProjects();
    };
  }, []);

  return (
    <div className="dashboard">
      <h2>Business Analytics</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Earnings</h3>
          <p>${earnings.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Clients</h3>
          <p>{clientCount}</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Projects by Status</h3>
          <CustomPieChart
            data={[
              { name: "Pending", value: projectStatus.pending },
              { name: "Active", value: projectStatus.active },
              { name: "Delivered", value: projectStatus.delivered },
            ]}
          />
        </div>

        <div className="chart-card">
          <h3>Clients by Type</h3>
          <CustomBarChart
            data={[
              { name: "Wedding", value: clientTypes.wedding },
              { name: "Portrait", value: clientTypes.portrait },
              { name: "Commercial", value: clientTypes.commercial },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
