import { db, auth } from './firebase';
import { 
  collection, onSnapshot, updateDoc, doc, 
  query, where, addDoc, orderBy 
} from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiClock, FiCheckCircle, FiPercent, 
  FiMail, FiSend, FiPlus, FiX, FiFileText,
  FiDownload, FiPrinter, FiEdit2, FiTrash2, FiSearch
} from 'react-icons/fi';
import { format } from 'date-fns';
import './Payments.css';

export function Payments() {
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    projectId: '',
    invoiceNumber: '',
    amount: '',
    dueDate: '',
    status: 'Unpaid',
    description: ''
  });

  // Fetch data with user isolation
  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    let unsubscribeFunctions = [];

    const loadData = async () => {
      try {
        // Clients
        const clientsQuery = query(
          collection(db, 'clients'),
          where('userId', '==', userId)
        );
        unsubscribeFunctions.push(
          onSnapshot(clientsQuery, (snapshot) => {
            setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          })
        );

        // Projects
        const projectsQuery = query(
          collection(db, 'projects'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        unsubscribeFunctions.push(
          onSnapshot(projectsQuery, (snapshot) => {
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          })
        );

        // Invoices
        const invoicesQuery = query(
          collection(db, 'invoices'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        unsubscribeFunctions.push(
          onSnapshot(invoicesQuery, (snapshot) => {
            setInvoices(snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                amount: typeof data.amount === 'string' ? parseFloat(data.amount) : Number(data.amount) || 0,
                dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
              };
            }));
            setIsLoading(false);
          })
        );

      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub?.());
    };
  }, []);

  const handlePaymentUpdate = async (id, status) => {
    await updateDoc(doc(db, 'invoices', id), { status });
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    
    if (!newInvoice.projectId || !newInvoice.invoiceNumber || !newInvoice.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const project = projects.find(p => p.id === newInvoice.projectId);
      if (!project) {
        alert('Selected project not found');
        return;
      }

      await addDoc(collection(db, 'invoices'), {
        ...newInvoice,
        amount: parseFloat(newInvoice.amount),
        dueDate: newInvoice.dueDate ? new Date(newInvoice.dueDate) : null,
        clientId: project.clientId,
        projectTitle: project.title,
        createdAt: new Date(),
        userId: auth.currentUser.uid
      });

      // Reset form
      setNewInvoice({
        projectId: '',
        invoiceNumber: '',
        amount: '',
        dueDate: '',
        status: 'Unpaid',
        description: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding invoice:', error);
      alert('Failed to add invoice');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice(prev => ({ ...prev, [name]: value }));
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'All') return true;
    return invoice.status === filter;
  });

  const getProjectInfo = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return { title: 'Unknown Project', clientId: null };
    return {
      title: project.title,
      clientId: project.clientId
    };
  };

  const getClientInfo = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return { name: 'Unknown Client', email: null };
    return {
      name: client.name,
      email: client.email
    };
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Paid': return 'payments-status-badge payments-status-paid';
      case 'Partial': return 'payments-status-badge payments-status-partial';
      case 'Unpaid': return 'payments-status-badge payments-status-unpaid';
      default: return 'payments-status-badge';
    }
  };

  const totalRevenue = invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

  const sendReminderEmail = (invoice) => {
    const projectInfo = getProjectInfo(invoice.projectId);
    const clientInfo = getClientInfo(projectInfo.clientId);
    
    if (!clientInfo.email) {
      alert('No email found for this client');
      return;
    }

    const subject = `Reminder: Invoice #${invoice.invoiceNumber} - Payment Pending`;
    const dueDate = invoice.dueDate ? format(invoice.dueDate, 'MMM dd, yyyy') : 'the due date';
    const body = `Dear ${clientInfo.name},\n\n` +
               `This is a friendly reminder that Invoice #${invoice.invoiceNumber} for $${(invoice.amount || 0).toFixed(2)} ` +
               `(Project: ${projectInfo.title}) is currently unpaid. The due date was ${dueDate}.\n\n` +
               `Please arrange for payment at your earliest convenience.\n\n` +
               `Thank you for your prompt attention to this matter.\n\n` +
               `Best regards,\n` +
               `[Your Company Name]`;

    const mailtoLink = `mailto:${clientInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const downloadInvoiceReport = (invoice) => {
    const projectInfo = getProjectInfo(invoice.projectId);
    const clientInfo = getClientInfo(projectInfo.clientId);
    
    const report = `
      INVOICE REPORT
      ==============
      
      Invoice #: ${invoice.invoiceNumber}
      Project: ${projectInfo.title}
      Client: ${clientInfo.name}
      Status: ${invoice.status}
      Amount: $${(invoice.amount || 0).toFixed(2)}
      Due Date: ${invoice.dueDate ? format(invoice.dueDate, 'MMM dd, yyyy') : 'Not specified'}
      
      Description:
      ${invoice.description || 'No description provided'}
      
      Created: ${invoice.createdAt ? format(invoice.createdAt, 'MMM dd, yyyy') : 'Unknown'}
    `;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoice.invoiceNumber}_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="payments-container">
      <div className="payments-header">
        <h1 className="payments-title">Payment Management</h1>
        <div className="payments-header-controls">
          <div className="payments-revenue-card">
            <FiDollarSign size={20} />
            <div>
              <p className="payments-revenue-label">Collected Revenue</p>
              <p className="payments-revenue-value">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <button 
            className="payments-add-button"
            onClick={() => setShowAddForm(true)}
          >
            <FiPlus /> New Invoice
          </button>
        </div>
      </div>

      {/* Add Invoice Form Modal */}
      {showAddForm && (
        <div className="payments-modal-overlay">
          <div className="payments-modal">
            <div className="payments-modal-header">
              <h3>Create New Invoice</h3>
              <button 
                className="payments-modal-close"
                onClick={() => setShowAddForm(false)}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleAddInvoice}>
              <div className="payments-form-group">
                <label>Project *</label>
                <select
                  name="projectId"
                  value={newInvoice.projectId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(project => {
                    const client = clients.find(c => c.id === project.clientId);
                    return (
                      <option key={project.id} value={project.id}>
                        {project.title} ({client?.name || 'Unknown Client'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="payments-form-row">
                <div className="payments-form-group">
                  <label>Invoice Number *</label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={newInvoice.invoiceNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="payments-form-group">
                  <label>Amount ($) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={newInvoice.amount}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="payments-form-row">
                <div className="payments-form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={newInvoice.dueDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="payments-form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={newInvoice.status}
                    onChange={handleInputChange}
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="payments-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={newInvoice.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="payments-form-actions">
                <button
                  type="button"
                  className="payments-cancel-button"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="payments-submit-button"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="payments-controls">
        <div className="payments-filter-group">
          <button
            className={`payments-filter-button ${filter === 'All' ? 'active' : ''}`}
            onClick={() => setFilter('All')}
          >
            All Payments
          </button>
          <button
            className={`payments-filter-button ${filter === 'Paid' ? 'active' : ''}`}
            onClick={() => setFilter('Paid')}
          >
            Paid
          </button>
          <button
            className={`payments-filter-button ${filter === 'Partial' ? 'active' : ''}`}
            onClick={() => setFilter('Partial')}
          >
            Partial
          </button>
          <button
            className={`payments-filter-button ${filter === 'Unpaid' ? 'active' : ''}`}
            onClick={() => setFilter('Unpaid')}
          >
            Unpaid
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="payments-loading">
          <div className="payments-spinner"></div>
        </div>
      ) : (
        <div className="payments-table-container">
          <table className="payments-table">
            <thead className="payments-table-header">
              <tr>
                <th className="payments-th">Invoice #</th>
                <th className="payments-th">Project</th>
                <th className="payments-th">Client</th>
                <th className="payments-th">Amount</th>
                <th className="payments-th">Due Date</th>
                <th className="payments-th">Status</th>
                <th className="payments-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => {
                const projectInfo = getProjectInfo(invoice.projectId);
                const clientInfo = getClientInfo(projectInfo.clientId);
                
                return (
                  <tr key={invoice.id} className="payments-tr">
                    <td className="payments-td">
                      <span className="payments-invoice-number">
                        INV-{invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="payments-td">
                      {projectInfo.title}
                    </td>
                    <td className="payments-td">
                      <div className="payments-client-cell">
                        <p className="payments-client-name">
                          {clientInfo.name}
                        </p>
                        {clientInfo.email && (
                          <p className="payments-client-email">
                            {clientInfo.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="payments-td payments-amount-cell">
                      ${(invoice.amount || 0).toFixed(2)}
                    </td>
                    <td className="payments-td">
                      {invoice.dueDate ? format(invoice.dueDate, 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="payments-td">
                      <div className={getStatusClass(invoice.status)}>
                        {invoice.status === 'Paid' && <FiCheckCircle size={14} />}
                        {invoice.status === 'Partial' && <FiPercent size={14} />}
                        {invoice.status === 'Unpaid' && <FiClock size={14} />}
                        {invoice.status}
                      </div>
                    </td>
                    <td className="payments-td">
                      <div className="payments-action-buttons">
                        <select
                          value={invoice.status}
                          onChange={(e) => handlePaymentUpdate(invoice.id, e.target.value)}
                          className="payments-select"
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Partial">Partial</option>
                          <option value="Paid">Paid</option>
                        </select>
                        <button
                          className="payments-report-button"
                          onClick={() => downloadInvoiceReport(invoice)}
                          title="Download report"
                        >
                          <FiDownload size={16} />
                        </button>
                        {invoice.status === 'Unpaid' && (
                          <button
                            className="payments-remind-button"
                            onClick={() => sendReminderEmail(invoice)}
                            title="Send reminder email"
                          >
                            <FiSend size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}