import { db, auth } from '../firebase';
import { 
  collection, addDoc, doc, updateDoc, 
  onSnapshot, query, where, orderBy,
  deleteDoc, getDocs
} from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { 
  FiMail, FiPhone, FiUser, FiCalendar, 
  FiUsers, FiPlus, FiSearch, FiEdit2, 
  FiTrash2, FiChevronDown, FiX
} from "react-icons/fi";
import styles from './Clients.module.css';
import { toast } from 'react-hot-toast';

export function Clients() {
  // State Management
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "Regular",
    notes: ""
  });
  const [activeTab, setActiveTab] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingClient, setEditingClient] = useState(null);
  const [totalClients, setTotalClients] = useState(0);
  
  // Email Template States
  const [templates, setTemplates] = useState([]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [currentClientForEmail, setCurrentClientForEmail] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTemplateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Clients
  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const clientsQuery = query(
          collection(db, "clients"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const clientsSnapshot = await getDocs(clientsQuery);
        const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setClients(clientsData);
        setTotalClients(clientsData.length);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load clients");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const unsubscribeClients = onSnapshot(
      query(
        collection(db, "clients"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      ),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClients(data);
        setTotalClients(data.length);
      }
    );

    return () => {
      unsubscribeClients();
    };
  }, []);

  // Fetch Templates
  const fetchTemplates = async () => {
    try {
      const q = query(
        collection(db, 'templates'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const templatesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    }
  };

  // Process template with variables
  const processTemplate = (template, client) => {
    let subject = template.subject;
    let body = template.content;
    
    // Replace variables
    const replacements = {
      '{name}': client.name,
      '{email}': client.email,
      '{phone}': client.phone || '',
      '{invoice}': invoiceNumber || 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      '{date}': new Date().toLocaleDateString(),
      '{company}': client.company || '',
    };

    Object.entries(replacements).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(key, 'g'), value);
      body = body.replace(new RegExp(key, 'g'), value);
    });

    return { subject, body };
  };

  // Handle template selection
  const handleTemplateSelect = async (client, template) => {
    if (!client.email) {
      toast.error('This client has no email address');
      return;
    }

    // Check if template contains invoice variable
    if (template.subject.includes('{invoice}') || template.content.includes('{invoice}')) {
      setCurrentClientForEmail(client);
      setShowInvoiceModal(true);
      return;
    }
    
    sendEmail(client, template);
  };

  // Send email with processed template
  const sendEmail = (client, template) => {
    const { subject, body } = processTemplate(template, client);
    
    // Open email client
    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    
    setShowTemplateDropdown(false);
    setShowInvoiceModal(false);
    setInvoiceNumber("");
  };

  // Open template dropdown for a client
  const openTemplateDropdown = async (client) => {
    if (!client.email) {
      toast.error('This client has no email address');
      return;
    }

    setCurrentClientForEmail(client);
    await fetchTemplates();
    setShowTemplateDropdown(true);
  };

  // Filter Clients
  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Form Changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Client CRUD Operations
  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      const clientData = {
        ...formData,
        lastContact: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid
      };

      if (editingClient) {
        await updateDoc(doc(db, "clients", editingClient.id), clientData);
        setEditingClient(null);
        toast.success("Client updated successfully");
      } else {
        await addDoc(collection(db, "clients"), clientData);
        toast.success("Client added successfully");
      }

      setFormData({
        name: "",
        email: "",
        phone: "",
        type: "Regular",
        notes: ""
      });
      setActiveTab("list");

    } catch (error) {
      console.error("Error saving client:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Delete Client
  const deleteClient = async (clientId, clientName) => {
    if (window.confirm(`Are you sure you want to delete ${clientName}?`)) {
      try {
        await deleteDoc(doc(db, "clients", clientId));
        toast.success("Client deleted successfully");
      } catch (error) {
        console.error("Error deleting client:", error);
        toast.error("Error deleting client");
      }
    }
  };

  // Edit Client
  const editClient = (client) => {
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      type: client.type || "Regular",
      notes: client.notes || ""
    });
    setEditingClient(client);
    setActiveTab("add");
  };

  // Loading State
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Main Header */}
      <header className={styles.mainHeader}>
        <h1>Client Management</h1>
        <div className={styles.clientCount}>
          <FiUsers /> Total Clients: {totalClients}
        </div>
        <button 
          className={styles.primaryButton}
          onClick={() => {
            setEditingClient(null);
            setActiveTab('add');
          }}
        >
          <FiPlus /> Add Client
        </button>
      </header>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search clients by name, email or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Client List/Form */}
      <div className={styles.contentArea}>
        {activeTab === 'list' ? (
          <div className={styles.clientListContainer}>
            {filteredClients.length === 0 ? (
              <div className={styles.emptyState}>
                <FiUser />
                <h3>No clients found</h3>
                <p>Try adjusting your search or add a new client</p>
                <button
                  className={styles.primaryButton}
                  onClick={() => setActiveTab("add")}
                >
                  <FiPlus /> Add Client
                </button>
              </div>
            ) : (
              <div className={styles.clientGrid}>
                {filteredClients.map((client) => (
                  <div key={client.id} className={styles.clientCard}>
                    <div className={styles.clientHeader}>
                      <h3>
                        <FiUser /> {client.name}
                      </h3>
                      <div className={styles.clientActions}>
                        <button 
                          className={styles.iconButton}
                          onClick={() => editClient(client)}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          className={styles.iconButton}
                          onClick={() => deleteClient(client.id, client.name)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                    
                    <div className={styles.clientDetails}>
                      <p><FiMail /> {client.email || "Not provided"}</p>
                      <p><FiPhone /> {client.phone || "Not provided"}</p>
                      <p><FiCalendar /> Last contact: {new Date(client.lastContact).toLocaleDateString()}</p>
                    </div>
                    
                    {client.notes && (
                      <div className={styles.notesContainer}>
                        <p>{client.notes}</p>
                      </div>
                    )}
                    
                    <div className={styles.clientFooter}>
                      <button
                        className={styles.emailButton}
                        onClick={() => openTemplateDropdown(client)}
                        disabled={!client.email}
                      >
                        <FiMail /> Email Client
                      </button>
                      
                      {/* Template Dropdown */}
                      {showTemplateDropdown && currentClientForEmail?.id === client.id && (
                        <div 
                          ref={dropdownRef}
                          className={styles.templateDropdownContainer}
                        >
                          <div className={styles.templateDropdown}>
                            <div className={styles.dropdownHeader}>
                              <h4>Select Template</h4>
                              <button 
                                className={styles.closeDropdown}
                                onClick={() => setShowTemplateDropdown(false)}
                              >
                                <FiX />
                              </button>
                            </div>
                            <div className={styles.templateList}>
                              {templates.length === 0 ? (
                                <div className={styles.emptyTemplates}>
                                  No templates found. Create templates first.
                                </div>
                              ) : (
                                templates.map(template => (
                                  <div 
                                    key={template.id}
                                    className={styles.templateItem}
                                    onClick={() => handleTemplateSelect(client, template)}
                                  >
                                    <div className={styles.templateName}>{template.name}</div>
                                    <div className={styles.templateSubject}>{template.subject}</div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.formContainer}>
            <h2>
              {editingClient ? <><FiEdit2 /> Edit Client</> : <><FiPlus /> Add Client</>}
            </h2>
            <form onSubmit={handleAddClient}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                  >
                    <option value="Regular">Regular</option>
                    <option value="Premium">Premium</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setActiveTab("list");
                    setEditingClient(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                >
                  {editingClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Invoice Number Modal */}
      {showInvoiceModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.invoiceModal}>
            <div className={styles.modalHeader}>
              <h3>Enter Invoice Number</h3>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoiceNumber("");
                }}
              >
                <FiX />
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g., INV-2023-001"
                />
                <p className={styles.hint}>Leave blank to generate automatically</p>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoiceNumber("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => {
                  const template = templates.find(t => 
                    t.subject.includes('{invoice}') || t.content.includes('{invoice}')
                  );
                  if (template) {
                    sendEmail(currentClientForEmail, template);
                  }
                }}
              >
                Continue to Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}