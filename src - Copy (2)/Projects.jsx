import { db, auth } from "./firebase";
import { 
  collection, addDoc, doc, updateDoc, deleteDoc, 
  onSnapshot, query, where, orderBy 
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { 
  FiCalendar, FiUser, FiFileText, FiPlus, FiCheckCircle,
  FiClock, FiAlertCircle, FiTrendingUp, FiDollarSign,
  FiMail, FiPhone, FiPieChart, FiBarChart2, FiActivity,
  FiDownload, FiPrinter, FiEdit2, FiTrash2, FiSearch,
  FiSun, FiMoon
} from "react-icons/fi";
import { BarChart, PieChart, Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from "./ThemeContext";
import './Projects.css';

const COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8B5CF6', '#3B82F6'];

export function Projects() {
  const { darkMode, toggleTheme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Pending");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);

  // Load data
  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      setError("Please log in to view projects");
      return;
    }

    const userId = auth.currentUser.uid;
    let unsubscribeFunctions = [];

    const loadData = async () => {
      try {
        // Clients
        const clientsQuery = query(collection(db, "clients"), where("userId", "==", userId));
        unsubscribeFunctions.push(
          onSnapshot(clientsQuery, 
            (snapshot) => setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
            (err) => {
              console.error("Clients error:", err);
              setError("Failed to load clients");
            }
          )
        );

        // Projects with fallback
        try {
          const projectsQuery = query(
            collection(db, "projects"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
          );
          unsubscribeFunctions.push(
            onSnapshot(projectsQuery,
              (snapshot) => {
                setProjects(snapshot.docs.map(doc => {
                  const data = doc.data();
                  return {
                    id: doc.id,
                    ...data,
                    dueDate: data.dueDate || "",
                    createdAt: data.createdAt || new Date().toISOString()
                  };
                }));
                setIsLoading(false);
                setError(null);
              },
              (err) => {
                console.error("Projects query error:", err);
                // Fallback to simple query
                const fallbackQuery = query(
                  collection(db, "projects"),
                  where("userId", "==", userId)
                );
                unsubscribeFunctions.push(
                  onSnapshot(fallbackQuery,
                    (snapshot) => {
                      setProjects(snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                          id: doc.id,
                          ...data,
                          dueDate: data.dueDate || "",
                          createdAt: data.createdAt || new Date().toISOString()
                        };
                      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                      setIsLoading(false);
                    }
                  )
                );
              }
            )
          );
        } catch (err) {
          console.error("Projects load error:", err);
          setIsLoading(false);
          setError("Failed to load projects");
        }

        // Activities with fallback
        try {
          const activitiesQuery = query(
            collection(db, "projectActivities"),
            where("userId", "==", userId),
            orderBy("timestamp", "desc")
          );
          unsubscribeFunctions.push(
            onSnapshot(activitiesQuery,
              (snapshot) => setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
              (err) => {
                console.error("Activities query error:", err);
                // Fallback to simple query
                const fallbackQuery = query(
                  collection(db, "projectActivities"),
                  where("userId", "==", userId)
                );
                unsubscribeFunctions.push(
                  onSnapshot(fallbackQuery,
                    (snapshot) => {
                      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
                    }
                  )
                );
              }
            )
          );
        } catch (err) {
          console.error("Activities load error:", err);
        }

      } catch (err) {
        console.error("Initial load error:", err);
        setIsLoading(false);
        setError("Failed to load data");
      }
    };

    loadData();

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe?.());
    };
  }, []);

  const filteredProjects = projects.filter(project => {
    const client = clients.find(c => c.id === project.clientId);
    return (
      project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const resetForm = () => {
    setTitle("");
    setClientId("");
    setDueDate("");
    setStatus("Pending");
    setDescription("");
    setBudget("");
    setSelectedProject(null);
    setIsEditing(false);
  };

  const handleAddProject = async () => {
    if (!title || !clientId) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      const newProject = {
        title,
        clientId,
        dueDate: dueDate || null,
        status,
        description,
        budget: budget || null,
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid
      };
      
      await addDoc(collection(db, "projects"), newProject);
      
      await addDoc(collection(db, "projectActivities"), {
        type: "project_created",
        projectTitle: title,
        clientId: clientId,
        timestamp: new Date().toISOString(),
        message: `Created new project: ${title}`,
        userId: auth.currentUser.uid
      });
      
      resetForm();
      setActiveTab("list");
    } catch (error) {
      alert("Error adding project: " + error.message);
    }
  };

  const handleUpdateProject = async () => {
    if (!title || !clientId || !selectedProject) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      await updateDoc(doc(db, "projects", selectedProject.id), {
        title,
        clientId,
        dueDate: dueDate || null,
        status,
        description,
        budget: budget || null
      });

      await addDoc(collection(db, "projectActivities"), {
        type: "project_updated",
        projectTitle: title,
        timestamp: new Date().toISOString(),
        message: `Updated project: ${title}`,
        userId: auth.currentUser.uid
      });
      
      resetForm();
      setActiveTab("list");
    } catch (error) {
      alert("Error updating project: " + error.message);
    }
  };

  const handleDeleteProject = async (projectId, projectTitle) => {
    if (window.confirm(`Are you sure you want to delete "${projectTitle}"?`)) {
      try {
        await deleteDoc(doc(db, "projects", projectId));
        
        await addDoc(collection(db, "projectActivities"), {
          type: "project_deleted",
          projectTitle: projectTitle,
          timestamp: new Date().toISOString(),
          message: `Deleted project: ${projectTitle}`,
          userId: auth.currentUser.uid
        });
      } catch (error) {
        alert("Error deleting project: " + error.message);
      }
    }
  };

  const editProject = (project) => {
    setTitle(project.title);
    setClientId(project.clientId);
    setDueDate(project.dueDate || "");
    setStatus(project.status || "Pending");
    setDescription(project.description || "");
    setBudget(project.budget || "");
    setSelectedProject(project);
    setIsEditing(true);
    setActiveTab("add");
  };

  const handleUpdateStatus = async (projectId, newStatus, projectTitle) => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        status: newStatus
      });

      await addDoc(collection(db, "projectActivities"), {
        type: "status_changed",
        projectId: projectId,
        projectTitle: projectTitle,
        newStatus: newStatus,
        timestamp: new Date().toISOString(),
        message: `Changed status of "${projectTitle}" to ${newStatus}`,
        userId: auth.currentUser.uid
      });
    } catch (error) {
      alert("Error updating project: " + error.message);
    }
  };

  const generateProjectReport = (project) => {
    const client = clients.find(c => c.id === project.clientId);
    return `
      PROJECT REPORT
      ==============
      
      Title: ${project.title}
      Client: ${client?.name || "Unknown"}
      Status: ${project.status}
      Due Date: ${formatDate(project.dueDate)}
      Budget: $${project.budget || "Not specified"}
      
      Description:
      ${project.description || "No description provided"}
      
      Created: ${formatDate(project.createdAt)}
      Last Updated: ${formatDate(project.createdAt)}
    `;
  };

  const downloadProjectReport = (project) => {
    const report = generateProjectReport(project);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Project_${project.title.replace(/\s+/g, '_')}_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadChartData = (chartType) => {
    let data, fileName;
    
    if (chartType === 'stats') {
      data = [
        { name: 'Total Projects', value: projects.length },
        { name: 'Pending', value: projects.filter(p => p.status === "Pending").length },
        { name: 'In Progress', value: projects.filter(p => p.status === "In Progress").length },
        { name: 'Delivered', value: projects.filter(p => p.status === "Delivered").length }
      ];
      fileName = 'projects_stats.json';
    } else {
      data = [
        { name: 'Pending', value: projects.filter(p => p.status === "Pending").length },
        { name: 'In Progress', value: projects.filter(p => p.status === "In Progress").length },
        { name: 'Delivered', value: projects.filter(p => p.status === "Delivered").length }
      ];
      fileName = 'projects_status_distribution.json';
    }
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Chart Data
  const statsData = [
    { name: 'Total Projects', value: projects.length, icon: <FiFileText size={24} />, color: '#4285F4' },
    { name: 'Pending', value: projects.filter(p => p.status === "Pending").length, icon: <FiClock size={24} />, color: '#FBBC05' },
    { name: 'In Progress', value: projects.filter(p => p.status === "In Progress").length, icon: <FiTrendingUp size={24} />, color: '#34A853' },
    { name: 'Delivered', value: projects.filter(p => p.status === "Delivered").length, icon: <FiCheckCircle size={24} />, color: '#EA4335' }
  ];

  const statusData = [
    { name: 'Pending', value: projects.filter(p => p.status === "Pending").length, color: '#FBBC05' },
    { name: 'In Progress', value: projects.filter(p => p.status === "In Progress").length, color: '#34A853' },
    { name: 'Delivered', value: projects.filter(p => p.status === "Delivered").length, color: '#EA4335' }
  ];

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const formatActivityTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInHours = Math.floor((now - activityTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return activityTime.toLocaleDateString();
  };

  const getStatusClass = (status) => {
    switch(status) {
      case "Pending": return "status-badge status-pending";
      case "In Progress": return "status-badge status-in-progress";
      case "Delivered": return "status-badge status-delivered";
      default: return "status-badge";
    }
  };

  return (
    <div className={`projects-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="projects-header">
        <h1 className="projects-title">Project Management</h1>
        <div className="projects-header-actions">
          <button 
            className="projects-theme-toggle"
            onClick={toggleTheme}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          <button 
            className="projects-button projects-primary-button"
            onClick={() => {
              resetForm();
              setActiveTab('add');
            }}
          >
            <FiPlus /> Add Project
          </button>
        </div>
      </div>

      <div className="projects-tabs">
        <button 
          className={`projects-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Project List
        </button>
        <button 
          className={`projects-tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => {
            resetForm();
            setActiveTab('add');
          }}
        >
          {isEditing ? "Edit Project" : "Add New Project"}
        </button>
      </div>

      <div className="projects-main">
        {activeTab === 'list' ? (
          <>
            <div className="projects-search-container">
              <FiSearch className="projects-search-icon" />
              <input
                type="text"
                placeholder="Search projects by title, client or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="projects-search-input"
              />
            </div>

            {error ? (
              <div className="projects-error-state">
                <FiAlertCircle size={24} />
                <h3>Error Loading Data</h3>
                <p>{error}</p>
                <button 
                  className="projects-button projects-primary-button"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
              </div>
            ) : isLoading ? (
              <div className="projects-loading-state">
                <div className="projects-spinner"></div>
                <p>Loading projects...</p>
              </div>
            ) : (
              <>
                <div className="projects-stats-container">
                  {statsData.map(stat => (
                    <div key={stat.name} className="projects-stat-card">
                      <div className="projects-stat-icon" style={{ backgroundColor: stat.color }}>
                        {stat.icon}
                      </div>
                      <p className="projects-stat-value">{stat.value}</p>
                      <p className="projects-stat-label">{stat.name}</p>
                    </div>
                  ))}
                </div>

                {filteredProjects.length === 0 ? (
                  <div className="projects-empty-state">
                    <FiFileText size={48} />
                    <h3>No projects found</h3>
                    <p>Try adjusting your search or add a new project</p>
                    <button
                      className="projects-button projects-primary-button"
                      onClick={() => setActiveTab("add")}
                    >
                      <FiPlus /> Add Project
                    </button>
                  </div>
                ) : (
                  <div className="projects-grid">
                    {filteredProjects.map(project => {
                      const client = clients.find(c => c.id === project.clientId);
                      return (
                        <div key={project.id} className="projects-card">
                          <div className="projects-card-header">
                            <h3 className="projects-card-title">
                              <FiFileText /> {project.title}
                            </h3>
                            <div className={getStatusClass(project.status)}>
                              {project.status}
                            </div>
                          </div>

                          <p className="projects-card-detail">
                            <FiUser /> {client?.name || "Unknown Client"}
                          </p>
                          <p className="projects-card-detail">
                            <FiCalendar /> Due: {formatDate(project.dueDate)}
                          </p>
                          {project.budget && (
                            <p className="projects-card-detail">
                              <FiDollarSign /> Budget: ${project.budget}
                            </p>
                          )}
                          {project.description && (
                            <div className="projects-notes-container">
                              <p>{project.description}</p>
                            </div>
                          )}
                          <select
                            value={project.status}
                            onChange={(e) => handleUpdateStatus(project.id, e.target.value, project.title)}
                            className="projects-status-select"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                          <div className="projects-action-buttons">
                            <button
                              onClick={() => downloadProjectReport(project)}
                              className="projects-action-button projects-report-button"
                            >
                              <FiDownload /> Report
                            </button>
                            <button
                              onClick={() => editProject(project)}
                              className="projects-action-button projects-edit-button"
                            >
                              <FiEdit2 /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id, project.title)}
                              className="projects-action-button projects-delete-button"
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="projects-activity-container">
                  <div className="projects-chart-header">
                    <FiActivity size={20} /> Recent Activities
                  </div>
                  <div>
                    {activities.slice(0, 5).map(activity => (
                      <div key={activity.id} className="projects-activity-item">
                        <div className="projects-activity-icon">
                          {activity.type === "status_changed" ? <FiTrendingUp size={20} /> : 
                          activity.type === "project_created" ? <FiPlus size={20} /> :
                          activity.type === "project_updated" ? <FiEdit2 size={20} /> :
                          <FiTrash2 size={20} />}
                        </div>
                        <div className="projects-activity-content">
                          <p className="projects-activity-message">{activity.message}</p>
                          <p className="projects-activity-time">
                            <FiClock size={14} /> {formatActivityTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="projects-grid-col2">
                  <div className="projects-chart-container">
                    <div className="projects-chart-header">
                      <FiBarChart2 size={20} /> Project Statistics
                      <button 
                        onClick={() => downloadChartData('stats')}
                        className="projects-download-button"
                      >
                        <FiDownload size={16} />
                      </button>
                    </div>
                    <div className="projects-chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value">
                            {statsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="projects-chart-container">
                    <div className="projects-chart-header">
                      <FiPieChart size={20} /> Status Distribution
                      <button 
                        onClick={() => downloadChartData('status')}
                        className="projects-download-button"
                      >
                        <FiDownload size={16} />
                      </button>
                    </div>
                    <div className="projects-chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="projects-form-container">
            <h2>{isEditing ? "Edit Project" : "Add New Project"}</h2>
            <div className="projects-form-grid">
              <div className="projects-form-group">
                <label>Project Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="projects-form-group">
                <label>Client *</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div className="projects-form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="projects-form-group">
                <label>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
              <div className="projects-form-group">
                <label>Budget ($)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div className="projects-form-group projects-form-group-full">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="projects-form-actions">
              <button 
                className="projects-button projects-secondary-button"
                onClick={() => {
                  resetForm();
                  setActiveTab('list');
                }}
              >
                Cancel
              </button>
              <button 
                className="projects-button projects-primary-button"
                onClick={isEditing ? handleUpdateProject : handleAddProject}
              >
                {isEditing ? "Update Project" : "Add Project"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}