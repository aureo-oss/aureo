import { db } from "../firebase";
import { query, where, collection, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { FiFolder } from "react-icons/fi";
import { auth } from "../firebase";
import { useState, useEffect } from "react";
import  PDFInvoice  from "../PDFInvoice";
import { FaFilePdf, FaFileInvoice, FaHistory, FaSearch, FaTimes } from "react-icons/fa";

export function InvoiceGenerator() {
  // State declarations
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [clientDetails, setClientDetails] = useState(null);
  const [items, setItems] = useState([{ description: "", amount: 0, quantity: 1 }]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [newInvoice, setNewInvoice] = useState(null);
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const userId = auth.currentUser?.uid;

  // Color scheme
  const colors = {
    background: "#121212",
    surface: "#1E1E1E",
    primary: "#4285F4",
    secondary: "#34A853",
    accent: "#FBBC05",
    error: "#EA4335",
    textPrimary: "#FFFFFF",
    textSecondary: "#B0B0B0",
    border: "rgba(255, 255, 255, 0.12)",
    hover: "rgba(255, 255, 255, 0.08)"
  };

  // Base styles
  const styles = {
    container: {
      padding: "32px",
      minHeight: "100vh",
      backgroundColor: colors.background,
      color: colors.textPrimary
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: "12px",
      border: `1px solid ${colors.border}`,
      overflow: "hidden",
      marginBottom: "24px"
    },
    section: {
      padding: "24px",
      borderBottom: `1px solid ${colors.border}`
    },
    heading: {
      fontSize: "20px",
      fontWeight: 600,
      margin: "0 0 16px 0",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "8px",
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      color: colors.textPrimary,
      fontSize: "14px",
      marginBottom: "16px"
    },
    button: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 24px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontWeight: 500,
      fontSize: "14px",
      transition: "all 0.2s ease"
    },
    primaryButton: {
      backgroundColor: colors.primary,
      color: "white"
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      border: `1px solid ${colors.border}`
    },
    dangerButton: {
      backgroundColor: colors.error,
      color: "white"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse"
    },
    tableHeader: {
      backgroundColor: colors.surface,
      padding: "16px",
      textAlign: "left",
      fontWeight: 600,
      borderBottom: `2px solid ${colors.border}`
    },
    tableCell: {
      padding: "16px",
      borderBottom: `1px solid ${colors.border}`
    }
  };

  // Data fetching with user isolation
  useEffect(() => {
    if (!userId) return;
  
    const unsubscribeClients = onSnapshot(
      query(collection(db, "clients"), where("userId", "==", userId)),
      (snapshot) => setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
  
    const unsubscribeInvoices = onSnapshot(
      query(collection(db, "invoices"), where("userId", "==", userId)),
      (snapshot) => setSavedInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
  
    const unsubscribeProjects = onSnapshot(
      query(collection(db, "projects"), where("userId", "==", userId)),
      (snapshot) => {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setIsLoading(false);
      }
    );
  
    // Cleanup on unmount
    return () => {
      unsubscribeClients();
      unsubscribeInvoices();
      unsubscribeProjects();
    };
  }, [userId]);
  

  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!selectedClient || !userId) return;
      
      try {
        const docRef = doc(db, "clients", selectedClient);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().userId === userId) {
          setClientDetails(docSnap.data());
        } else {
          setSelectedClient("");
          setClientDetails(null);
          alert("Client not found or access denied");
        }
      } catch (error) {
        console.error("Error fetching client details:", error);
      }
    };

    fetchClientDetails();
  }, [selectedClient, userId]);

  // Helper functions
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal + taxAmount - discountAmount;
    
    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const handleAddItem = () => {
    setItems([...items, { description: "", amount: 0, quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === "amount" || field === "quantity" ? Number(value) : value;
    setItems(newItems);
  };

  const handleLoadProjectItems = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const projectItems = [{
      description: project.title,
      amount: project.budget || 0,
      quantity: 1
    }];
    
    if (project.description) {
      projectItems.push({
        description: project.description,
        amount: 0,
        quantity: 1
      });
    }
    
    setItems(projectItems);
    setShowProjectModal(false);
  };

  const handleGenerateInvoice = async () => {
    if (!userId || !selectedClient || items.some(item => !item.description || item.amount <= 0)) {
      alert("Please fill all fields correctly!");
      return;
    }

    const totals = calculateTotals();
    const newInvoiceData = {
      clientId: selectedClient,
      clientName: clientDetails?.name || "",
      clientEmail: clientDetails?.email || "",
      items: items.map(item => ({
        ...item,
        amount: Number(item.amount),
        quantity: Number(item.quantity)
      })),
      invoiceNumber,
      date: invoiceDate,
      dueDate: dueDate || invoiceDate,
      status: "Pending",
      notes,
      taxRate: Number(taxRate),
      discount: Number(discount),
      ...totals,
      userId
    };

    try {
      const docRef = await addDoc(collection(db, "invoices"), newInvoiceData);
      setNewInvoice({ id: docRef.id, ...newInvoiceData });
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Error creating invoice: " + error.message);
    }
  };

  const handleDuplicateInvoice = (invoice) => {
    if (invoice.userId !== userId) {
      alert("You don't have permission to duplicate this invoice");
      return;
    }

    setSelectedClient(invoice.clientId);
    setItems(invoice.items);
    setInvoiceNumber(`INV-${Date.now()}`);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate("");
    setNotes(invoice.notes || "");
    setTaxRate(invoice.taxRate || 0);
    setDiscount(invoice.discount || 0);
    setNewInvoice(null);
    setShowHistory(false);
  };

  const filteredInvoices = savedInvoices
    .filter(invoice => 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.clientName && invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "100vh"
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: `4px solid ${colors.border}`,
            borderTopColor: colors.primary,
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "32px"
      }}>
        <h1 style={{ 
          fontSize: "24px", 
          fontWeight: 600, 
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <FaFileInvoice /> Invoice Generator
        </h1>
        <button 
          style={{ 
            ...styles.button,
            ...styles.secondaryButton,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
          onClick={() => setShowHistory(!showHistory)}
        >
          <FaHistory /> {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      {showHistory ? (
        <div style={styles.card}>
          <div style={styles.section}>
            <h2 style={styles.heading}>Invoice History</h2>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              backgroundColor: colors.surface,
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "24px"
            }}>
              <FaSearch style={{ color: colors.textSecondary, marginRight: "12px" }} />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...styles.input,
                  border: "none",
                  backgroundColor: "transparent",
                  padding: "0",
                  margin: "0"
                }}
              />
            </div>

            {filteredInvoices.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Invoice #</th>
                      <th style={styles.tableHeader}>Client</th>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Total</th>
                      <th style={styles.tableHeader}>Status</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map(invoice => (
                      <tr key={invoice.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={styles.tableCell}>{invoice.invoiceNumber}</td>
                        <td style={styles.tableCell}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              backgroundColor: colors.primary,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: 600
                            }}>
                              {invoice.clientName?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{invoice.clientName}</div>
                              <div style={{ color: colors.textSecondary, fontSize: "14px" }}>
                                {invoice.clientEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td style={styles.tableCell}>${invoice.total}</td>
                        <td style={styles.tableCell}>
                          <span style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor: invoice.status === "Paid" 
                              ? "rgba(52, 168, 83, 0.1)" 
                              : "rgba(251, 188, 5, 0.1)",
                            color: invoice.status === "Paid" 
                              ? colors.secondary 
                              : colors.accent
                          }}>
                            {invoice.status}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              style={{ 
                                ...styles.button,
                                ...styles.secondaryButton,
                                padding: "8px 16px"
                              }}
                              onClick={() => handleDuplicateInvoice(invoice)}
                            >
                              Duplicate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ 
                textAlign: "center", 
                padding: "40px",
                color: colors.textSecondary
              }}>
                No invoices found
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={styles.card}>
            <div style={styles.section}>
              <h2 style={styles.heading}>Client Information</h2>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                style={styles.input}
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.email}
                  </option>
                ))}
              </select>

              {clientDetails && (
                <div style={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "8px",
                  padding: "16px",
                  marginTop: "16px"
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "16px",
                    marginBottom: "12px"
                  }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: colors.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "18px"
                    }}>
                      {clientDetails.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "16px" }}>
                        {clientDetails.name}
                      </div>
                      <div style={{ color: colors.textSecondary, fontSize: "14px" }}>
                        {clientDetails.email}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "12px"
                  }}>
                    <div>
                      <div style={{ color: colors.textSecondary, fontSize: "12px" }}>Phone</div>
                      <div>{clientDetails.phone || "N/A"}</div>
                    </div>
                    <div>
                      <div style={{ color: colors.textSecondary, fontSize: "12px" }}>Address</div>
                      <div>{clientDetails.address || "N/A"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.section}>
              <h2 style={styles.heading}>Invoice Details</h2>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "16px"
              }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px",
                    color: colors.textSecondary
                  }}>
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px",
                    color: colors.textSecondary
                  }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px",
                    color: colors.textSecondary
                  }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={invoiceDate}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.heading}>Items</h2>
              {items.map((item, index) => (
                <div key={index} style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 100px 100px 40px",
                  gap: "8px",
                  marginBottom: "8px",
                  alignItems: "center"
                }}>
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    style={{
                      ...styles.input,
                      marginBottom: "0"
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    min="1"
                    style={{
                      ...styles.input,
                      marginBottom: "0"
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                    min="0"
                    step="0.01"
                    style={{
                      ...styles.input,
                      marginBottom: "0"
                    }}
                  />
                  <button 
                    onClick={() => handleRemoveItem(index)}
                    style={{
                      ...styles.button,
                      ...styles.dangerButton,
                      height: "44px",
                      width: "44px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0"
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={handleAddItem} 
                  style={{ 
                    ...styles.button,
                    ...styles.secondaryButton,
                    marginTop: "8px"
                  }}
                >
                  + Add Item
                </button>
                <button 
                  onClick={() => setShowProjectModal(true)}
                  style={{ 
                    ...styles.button,
                    ...styles.secondaryButton,
                    marginTop: "8px"
                  }}
                >
                  <FiFolder /> Load from Project
                </button>
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.heading}>Adjustments</h2>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "16px"
              }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px",
                    color: colors.textSecondary
                  }}>
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.01"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px",
                    color: colors.textSecondary
                  }}>
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.01"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.heading}>Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or terms..."
                rows="4"
                style={{
                  ...styles.input,
                  minHeight: "120px",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ 
              padding: "24px",
              backgroundColor: "rgba(255, 255, 255, 0.05)"
            }}>
              <h2 style={styles.heading}>Invoice Summary</h2>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  marginBottom: "8px"
                }}>
                  <span>Subtotal:</span>
                  <span>${calculateTotals().subtotal}</span>
                </div>
                {taxRate > 0 && (
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span>Tax ({taxRate}%):</span>
                    <span>${calculateTotals().taxAmount}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span>Discount ({discount}%):</span>
                    <span>-${calculateTotals().discountAmount}</span>
                  </div>
                )}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: `1px solid ${colors.border}`,
                  fontWeight: 600,
                  fontSize: "18px"
                }}>
                  <span>Total:</span>
                  <span>${calculateTotals().total}</span>
                </div>
              </div>
              <button 
                onClick={handleGenerateInvoice} 
                style={{ 
                  ...styles.button,
                  ...styles.primaryButton,
                  width: "100%",
                  justifyContent: "center"
                }}
              >
                <FaFilePdf /> Generate Invoice
              </button>
            </div>
          </div>

          {newInvoice && (
            <div style={styles.card}>
              <div style={styles.section}>
                <h2 style={styles.heading}>Invoice Preview</h2>
                <PDFInvoice invoice={newInvoice} />
                <div style={{ 
                  display: "flex", 
                  justifyContent: "flex-end",
                  gap: "16px",
                  marginTop: "24px"
                }}>
                  <button 
                    style={{ 
                      ...styles.button,
                      ...styles.secondaryButton
                    }}
                    onClick={() => setNewInvoice(null)}
                  >
                    Back to Form
                  </button>
                  <button 
                    style={{ 
                      ...styles.button,
                      ...styles.primaryButton
                    }}
                    onClick={() => window.print()}
                  >
                    Print Invoice
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showProjectModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: colors.surface,
            padding: "24px",
            borderRadius: "12px",
            width: "80%",
            maxWidth: "600px",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px"
            }}>
              <h2 style={{ margin: 0 }}>Select Project</h2>
              <button 
                onClick={() => setShowProjectModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: colors.textPrimary,
                  fontSize: "24px",
                  cursor: "pointer"
                }}
              >
                ×
              </button>
            </div>
            
            {projects.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "16px"
              }}>
                {projects.map(project => (
                  <div 
                    key={project.id}
                    onClick={() => handleLoadProjectItems(project.id)}
                    style={{
                      backgroundColor: colors.background,
                      padding: "16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      border: `1px solid ${colors.border}`,
                      ":hover": {
                        borderColor: colors.primary
                      }
                    }}
                  >
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px",
                      marginBottom: "8px"
                    }}>
                      <FiFolder size={20} color={colors.primary} />
                      <h3 style={{ margin: 0 }}>{project.title}</h3>
                    </div>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between",
                      fontSize: "14px"
                    }}>
                      <span>Budget:</span>
                      <span>${project.budget || "Not set"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px" }}>
                No projects found
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx="true" global="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: ${colors.background};
          color: ${colors.textPrimary};
        }
        
        input, select, textarea, button {
          font-family: inherit;
          font-size: inherit;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.2);
        }
        
        button:hover {
          opacity: 0.9;
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}