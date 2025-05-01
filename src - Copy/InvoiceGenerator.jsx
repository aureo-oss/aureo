import { db } from "./firebase";
import { collection, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { PDFInvoice } from "./PDFInvoice";
import { FaFilePdf, FaEnvelope, FaFileInvoice, FaHistory, FaSearch, FaTimes } from "react-icons/fa";
import { useTheme } from "./context/ThemeContext";

export function InvoiceGenerator() {
  const { darkMode } = useTheme();
  
  // State for invoice generation
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

  // State for client communication
  const [communicationTemplates, setCommunicationTemplates] = useState([
    {
      id: 1,
      name: "Payment Reminder",
      subject: "Reminder: Invoice #{invoiceNumber} Payment Due",
      body: `Dear {clientName},\n\nThis is a friendly reminder that your invoice #{invoiceNumber} for {totalAmount} is due on {dueDate}.\n\nPlease make the payment at your earliest convenience.\n\nBest regards,\nYour Name`
    },
    {
      id: 2,
      name: "Thank You",
      subject: "Thank you for your payment",
      body: `Dear {clientName},\n\nThank you for your recent payment of {totalAmount} for invoice #{invoiceNumber}.\n\nWe appreciate your business!\n\nBest regards,\nYour Name`
    },
    {
      id: 3,
      name: "Follow Up",
      subject: "Follow up on our recent work",
      body: `Dear {clientName},\n\nI hope you're enjoying the results of our recent collaboration.\n\nIf you have any questions or need further assistance, please don't hesitate to reach out.\n\nBest regards,\nYour Name`
    }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);

  // State for invoice history/search
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Load clients
        const unsubscribeClients = onSnapshot(collection(db, "clients"), (snapshot) => {
          setClients(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });

        // Load invoice history
        const unsubscribeInvoices = onSnapshot(collection(db, "invoices"), (snapshot) => {
          setSavedInvoices(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          setIsLoading(false);
        });

        return () => {
          unsubscribeClients();
          unsubscribeInvoices();
        };
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      const fetchClientDetails = async () => {
        setIsLoading(true);
        try {
          const docRef = doc(db, "clients", selectedClient);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setClientDetails(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching client details:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchClientDetails();
    } else {
      setClientDetails(null);
    }
  }, [selectedClient]);

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

  const handleGenerateInvoice = async () => {
    if (!selectedClient || items.some(item => !item.description || item.amount <= 0)) {
      alert("Please fill all fields correctly!");
      return;
    }

    setIsLoading(true);
    const totals = calculateTotals();
    const newInvoiceData = {
      clientId: selectedClient,
      clientName: clientDetails?.name || "",
      clientEmail: clientDetails?.email || "",
      items,
      invoiceNumber,
      date: invoiceDate,
      dueDate: dueDate || invoiceDate,
      status: "Pending",
      notes,
      taxRate,
      discount,
      ...totals
    };

    try {
      const docRef = await addDoc(collection(db, "invoices"), newInvoiceData);
      setNewInvoice({ id: docRef.id, ...newInvoiceData });
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Error creating invoice: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = communicationTemplates.find(t => t.id === templateId);
    if (template && clientDetails) {
      const populatedSubject = template.subject
        .replace('{invoiceNumber}', invoiceNumber)
        .replace('{clientName}', clientDetails.name)
        .replace('{totalAmount}', calculateTotals().total);
      
      const populatedBody = template.body
        .replace('{invoiceNumber}', invoiceNumber)
        .replace('{clientName}', clientDetails.name)
        .replace('{totalAmount}', calculateTotals().total)
        .replace('{dueDate}', dueDate || invoiceDate);

      setEmailSubject(populatedSubject);
      setEmailBody(populatedBody);
      setShowEmailModal(true);
    }
  };

  const handleSendEmail = () => {
    if (!clientDetails?.email) {
      alert("Client email not available");
      return;
    }
    
    const mailtoLink = `mailto:${clientDetails.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
    setShowEmailModal(false);
  };

  const handleDuplicateInvoice = (invoice) => {
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
    window.scrollTo(0, 0);
  };

  const filteredInvoices = savedInvoices
    .filter(invoice => {
      const matchesSearch = searchTerm === "" || 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.clientName && invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (isLoading) {
    return (
      <div className={`invoice-generator-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`invoice-generator-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="invoice-header">
        <h2><FaFileInvoice /> Invoice Generator</h2>
        <div className="header-actions">
          <button 
            className={`history-button ${darkMode ? 'dark' : 'light'}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            <FaHistory /> {showHistory ? 'Hide History' : 'Show History'}
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className={`invoice-history ${darkMode ? 'dark' : 'light'}`}>
          <div className={`search-bar ${darkMode ? 'dark' : 'light'}`}>
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`search-input ${darkMode ? 'dark' : 'light'}`}
            />
          </div>
          <div className="history-list">
            {filteredInvoices.length > 0 ? (
              <table className={`clients-table ${darkMode ? 'dark' : 'light'}`}>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(invoice => (
                    <tr key={invoice.id} className="invoice-row">
                      <td>{invoice.invoiceNumber}</td>
                      <td>
                        <div className="client-info">
                          <div className={`avatar ${darkMode ? 'dark' : 'light'}`}>
                            {invoice.clientName?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <div className="client-name">{invoice.clientName}</div>
                            <div className="client-email">{invoice.clientEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td>{new Date(invoice.date).toLocaleDateString()}</td>
                      <td>${invoice.total}</td>
                      <td className={`status-${invoice.status.toLowerCase()}`}>
                        {invoice.status}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDuplicateInvoice(invoice)}
                          className={`action-button ${darkMode ? 'dark' : 'light'}`}
                        >
                          Duplicate
                        </button>
                        <button 
                          onClick={() => {
                            setNewInvoice(invoice);
                            setShowHistory(false);
                          }}
                          className={`action-button ${darkMode ? 'dark' : 'light'}`}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-invoices">No invoices found</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={`invoice-form ${darkMode ? 'dark' : 'light'}`}>
            <div className="form-section">
              <h3>Client Information</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Select Client:</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className={`select-input ${darkMode ? 'dark' : 'light'}`}
                  >
                    <option value="">Select Client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {clientDetails && (
                <div className={`client-details ${darkMode ? 'dark' : 'light'}`}>
                  <p><strong>Email:</strong> {clientDetails.email}</p>
                  <p><strong>Phone:</strong> {clientDetails.phone || 'N/A'}</p>
                  <p><strong>Address:</strong> {clientDetails.address || 'N/A'}</p>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Invoice Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Invoice Number:</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className={`text-input ${darkMode ? 'dark' : 'light'}`}
                  />
                </div>
                <div className="form-group">
                  <label>Date:</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className={`date-input ${darkMode ? 'dark' : 'light'}`}
                  />
                </div>
                <div className="form-group">
                  <label>Due Date:</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={invoiceDate}
                    className={`date-input ${darkMode ? 'dark' : 'light'}`}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Items</h3>
              {items.map((item, index) => (
                <div key={index} className="item-row">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    className={`item-input ${darkMode ? 'dark' : 'light'}`}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    min="1"
                    className={`item-input ${darkMode ? 'dark' : 'light'}`}
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                    min="0"
                    step="0.01"
                    className={`item-input ${darkMode ? 'dark' : 'light'}`}
                  />
                  <button 
                    onClick={() => handleRemoveItem(index)}
                    className="remove-button"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button 
                onClick={handleAddItem} 
                className={`add-button ${darkMode ? 'dark' : 'light'}`}
              >
                + Add Item
              </button>
            </div>

            <div className="form-section">
              <h3>Adjustments</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Tax Rate (%):</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.01"
                    className={`number-input ${darkMode ? 'dark' : 'light'}`}
                  />
                </div>
                <div className="form-group">
                  <label>Discount (%):</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.01"
                    className={`number-input ${darkMode ? 'dark' : 'light'}`}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or terms..."
                rows="3"
                className={`notes-textarea ${darkMode ? 'dark' : 'light'}`}
              />
            </div>

            <div className={`totals-section ${darkMode ? 'dark' : 'light'}`}>
              <h3>Invoice Summary</h3>
              <div className="totals-row">
                <span>Subtotal:</span>
                <span>${calculateTotals().subtotal}</span>
              </div>
              {taxRate > 0 && (
                <div className="totals-row">
                  <span>Tax ({taxRate}%):</span>
                  <span>${calculateTotals().taxAmount}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="totals-row">
                  <span>Discount ({discount}%):</span>
                  <span>-${calculateTotals().discountAmount}</span>
                </div>
              )}
              <div className="totals-row grand-total">
                <span>Total:</span>
                <span>${calculateTotals().total}</span>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                onClick={handleGenerateInvoice} 
                className={`generate-button ${darkMode ? 'dark' : 'light'}`}
              >
                <FaFilePdf /> Generate Invoice
              </button>
            </div>
          </div>

          {/* Client Communication Section */}
          {selectedClient && clientDetails && (
            <div className={`communication-section ${darkMode ? 'dark' : 'light'}`}>
              <h3><FaEnvelope /> Client Communication</h3>
              <div className="template-selector">
                <label>Select Template:</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(Number(e.target.value))}
                  className={`select-input ${darkMode ? 'dark' : 'light'}`}
                >
                  <option value="">Select a template</option>
                  {communicationTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Email Modal */}
          {showEmailModal && (
            <div className="modal-overlay">
              <div className={`modal ${darkMode ? 'dark' : 'light'}`}>
                <div className="modal-header">
                  <h3>Send Email to Client</h3>
                  <button 
                    onClick={() => setShowEmailModal(false)} 
                    className="close-button"
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="email-form">
                  <div className="form-group">
                    <label>To:</label>
                    <input
                      type="email"
                      value={clientDetails?.email || ""}
                      readOnly
                      className={`email-input ${darkMode ? 'dark' : 'light'}`}
                    />
                  </div>
                  <div className="form-group">
                    <label>Subject:</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className={`text-input ${darkMode ? 'dark' : 'light'}`}
                    />
                  </div>
                  <div className="form-group">
                    <label>Message:</label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows="8"
                      className={`message-textarea ${darkMode ? 'dark' : 'light'}`}
                    />
                  </div>
                  <div className="modal-actions">
                    <button 
                      onClick={() => setShowEmailModal(false)}
                      className={`cancel-button ${darkMode ? 'dark' : 'light'}`}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSendEmail} 
                      className={`send-button ${darkMode ? 'dark' : 'light'}`}
                    >
                      <FaEnvelope /> Open in Email Client
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PDF Invoice Preview */}
          {newInvoice && (
            <div className={`invoice-preview ${darkMode ? 'dark' : 'light'}`}>
              <h3>Invoice Preview</h3>
              <PDFInvoice invoice={newInvoice} />
              <div className="preview-actions">
                <button 
                  onClick={() => window.print()}
                  className={`print-button ${darkMode ? 'dark' : 'light'}`}
                >
                  Print Invoice
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        /* Base Styles */
        .invoice-generator-container {
          padding: 2rem;
          min-height: 100vh;
          transition: all 0.3s ease;
        }

        .invoice-generator-container.light {
          background-color: #f8fafc;
          color: #1e293b;
        }

        .invoice-generator-container.dark {
          background-color: #0f172a;
          color: #f8fafc;
        }

        /* Header */
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid;
        }

        .invoice-header.light {
          border-color: #e2e8f0;
        }

        .invoice-header.dark {
          border-color: #334155;
        }

        .invoice-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        /* Buttons */
        button {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .history-button.light, .add-button.light, .cancel-button.light {
          background-color: #e2e8f0;
          color: #1e293b;
        }

        .history-button.dark, .add-button.dark, .cancel-button.dark {
          background-color: #334155;
          color: #f8fafc;
        }

        .history-button:hover, .add-button:hover, .cancel-button:hover {
          opacity: 0.9;
        }

        .generate-button.light, .action-button.light {
          background-color: #4f46e5;
          color: white;
        }

        .generate-button.dark, .action-button.dark {
          background-color: #6366f1;
          color: white;
        }

        .generate-button:hover, .action-button:hover {
          background-color: #4338ca;
        }

        .send-button.light {
          background-color: #10b981;
          color: white;
        }

        .send-button.dark {
          background-color: #34d399;
          color: white;
        }

        .send-button:hover {
          background-color: #059669;
        }

        .print-button.light {
          background-color: #64748b;
          color: white;
        }

        .print-button.dark {
          background-color: #94a3b8;
          color: #1e293b;
        }

        .print-button:hover {
          background-color: #475569;
        }

        .remove-button {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 0.25rem;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .remove-button:hover {
          background: #dc2626;
        }

        /* Form Sections */
        .invoice-form, .communication-section, .invoice-history {
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
        }

        .invoice-form.light, .communication-section.light, .invoice-history.light {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
        }

        .invoice-form.dark, .communication-section.dark, .invoice-history.dark {
          background-color: #1e293b;
          border: 1px solid #334155;
        }

        .form-section {
          padding: 1.5rem;
          border-bottom: 1px solid;
        }

        .form-section.light {
          border-color: #e2e8f0;
        }

        .form-section.dark {
          border-color: #334155;
        }

        .form-section h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .form-group {
          flex: 1;
          min-width: 200px;
          margin-bottom: 1rem;
        }

        .full-width {
          flex: 0 0 100%;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .light label {
          color: #334155;
        }

        .dark label {
          color: #e2e8f0;
        }

        /* Input Fields */
        input, select, textarea {
          width: 100%;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        input.light, select.light, textarea.light {
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          color: #1e293b;
        }

        input.dark, select.dark, textarea.dark {
          background-color: #334155;
          border: 1px solid #475569;
          color: #f8fafc;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        /* Item Rows */
        .item-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          align-items: center;
        }

        .item-row input {
          flex: 3 1 0;
        }

        .item-row input[type="number"] {
          flex: 1 1 0;
        }

        /* Totals Section */
        .totals-section {
          padding: 1.5rem;
        }

        .totals-section.light {
          background-color: #f1f5f9;
        }

        .totals-section.dark {
          background-color: #334155;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .grand-total {
          font-weight: 600;
          font-size: 1.125rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid;
        }

        .grand-total.light {
          border-color: #cbd5e1;
        }

        .grand-total.dark {
          border-color: #475569;
        }

        /* Client Details */
        .client-details {
          padding: 1rem;
          border-radius: 0.375rem;
          margin-top: 1rem;
        }

        .client-details.light {
          background-color: #f1f5f9;
        }

        .client-details.dark {
          background-color: #334155;
        }

        .client-details p {
          margin: 0.5rem 0;
        }

        .light .client-details p {
          color: #475569;
        }

        .dark .client-details p {
          color: #cbd5e1;
        }

        /* Client Info */
        .client-info {
          display: flex;
          align-items: center;
        }

        .avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
          font-weight: 600;
        }

        .avatar.light {
          background-color: #e0e7ff;
          color: #4f46e5;
        }

        .avatar.dark {
          background-color: #3730a3;
          color: #a5b4fc;
        }

        .client-name {
          font-weight: 500;
        }

        .light .client-name {
          color: #1e293b;
        }

        .dark .client-name {
          color: #f8fafc;
        }

        .client-email {
          font-size: 0.875rem;
        }

        .light .client-email {
          color: #64748b;
        }

        .dark .client-email {
          color: #94a3b8;
        }

        /* Status */
        .status-pending {
          color: #f59e0b;
        }

        .status-paid {
          color: #10b981;
        }

        /* Search Bar */
        .search-bar {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          margin-bottom: 1.5rem;
        }

        .search-bar.light {
          background-color: #f1f5f9;
        }

        .search-bar.dark {
          background-color: #334155;
        }

        .search-input {
          border: none;
          background: transparent;
          margin-left: 0.5rem;
          flex: 1;
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .search-icon {
          color: #64748b;
        }

        /* Table */
        .clients-table {
          width: 100%;
          border-collapse: collapse;
        }

        .clients-table th, .clients-table td {
          padding: 1rem;
          text-align: left;
        }

        .clients-table th {
          font-weight: 600;
        }

        .clients-table.light th {
          background-color: #f8fafc;
          color: #1e293b;
        }

        .clients-table.dark th {
          background-color: #1e293b;
          color: #f8fafc;
        }

        .clients-table td {
          border-bottom: 1px solid;
        }

        .clients-table.light td {
          border-color: #e2e8f0;
          color: #475569;
        }

        .clients-table.dark td {
          border-color: #334155;
          color: #cbd5e1;
        }

        .invoice-row:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .invoice-row.dark:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        /* No Invoices */
        .no-invoices {
          text-align: center;
          padding: 2rem;
        }

        .light .no-invoices {
          color: #64748b;
        }

        .dark .no-invoices {
          color: #94a3b8;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal {
          width: 90%;
          max-width: 600px;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal.light {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
        }

        .modal.dark {
          background-color: #1e293b;
          border: 1px solid #334155;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid;
        }

        .modal-header.light {
          border-color: #e2e8f0;
        }

        .modal-header.dark {
          border-color: #334155;
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .light .close-button {
          color: #64748b;
        }

        .dark .close-button {
          color: #94a3b8;
        }

        .close-button:hover {
          color: #ef4444;
        }

        .email-form {
          padding: 1.5rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 1.5rem;
          border-top: 1px solid;
        }

        .modal-actions.light {
          border-color: #e2e8f0;
        }

        .modal-actions.dark {
          border-color: #334155;
        }

        /* Invoice Preview */
        .invoice-preview {
          margin-top: 1.5rem;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .invoice-preview.light {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
        }

        .invoice-preview.dark {
          background-color: #1e293b;
          border: 1px solid #334155;
        }

        .preview-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        /* Loading Spinner */
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        .spinner {
          width: 2.5rem;
          height: 2.5rem;
          border: 4px solid;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner.light {
          border-color: #e2e8f0;
        }

        .spinner.dark {
          border-color: #334155;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .invoice-generator-container {
            padding: 1rem;
          }
          
          .invoice-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .header-actions {
            width: 100%;
          }
          
          .history-button, .generate-button {
            width: 100%;
            justify-content: center;
          }
          
          .form-row {
            flex-direction: column;
            gap: 0;
          }
          
          .form-group {
            min-width: 100%;
          }
          
          .item-row {
            flex-wrap: wrap;
          }
          
          .item-row input {
            flex: 1 1 100%;
            margin-bottom: 0.5rem;
          }
          
          .item-row button {
            margin-left: auto;
          }
          
          .modal {
            width: 95%;
          }
        }
      `}</style>
    </div>
  );
}