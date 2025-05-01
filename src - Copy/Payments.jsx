import { db } from './firebase';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useState, useEffect, useContext } from 'react';
import { FiDollarSign, FiClock, FiCheckCircle, FiPercent, FiMail, FiSend } from 'react-icons/fi';
import { format } from 'date-fns';
import { useTheme } from './context/ThemeContext'; // Import the theme context
import './Payments.css';

export function Payments() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const { darkMode } = useTheme(); // Get dark mode state

  useEffect(() => {
    const unsubscribeInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      setInvoices(snapshot.docs.map(doc => {
        const data = doc.data();
        const total = typeof data.total === 'string' ? parseFloat(data.total) : Number(data.total) || 0;
        const status = data.status === 'Pending' ? 'Unpaid' : data.status;
        const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate;
        
        return { 
          id: doc.id, 
          ...data,
          total,
          status,
          dueDate
        };
      }));
      setIsLoading(false);
    });

    const unsubscribeClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeInvoices();
      unsubscribeClients();
    };
  }, []);

  const handlePaymentUpdate = async (id, status) => {
    await updateDoc(doc(db, 'invoices', id), { status });
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'All') return true;
    return invoice.status === filter;
  });

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getClientEmail = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.email || null;
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Paid': return `payments-status-badge payments-status-paid ${darkMode ? 'dark' : ''}`;
      case 'Partial': return `payments-status-badge payments-status-partial ${darkMode ? 'dark' : ''}`;
      case 'Unpaid': return `payments-status-badge payments-status-unpaid ${darkMode ? 'dark' : ''}`;
      default: return `payments-status-badge ${darkMode ? 'dark' : ''}`;
    }
  };

  const totalRevenue = invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, invoice) => sum + (invoice.total || 0), 0);

  const sendReminderEmail = (invoice) => {
    const client = clients.find(c => c.id === invoice.clientId);
    if (!client?.email) {
      alert('No email found for this client');
      return;
    }

    const subject = `Reminder: Invoice #${invoice.invoiceNumber} - Payment Pending`;
    const dueDate = invoice.dueDate ? format(invoice.dueDate, 'MMM dd, yyyy') : 'the due date';
    const body = `Dear ${client.name},\n\n` +
                 `This is a friendly reminder that Invoice #${invoice.invoiceNumber} for $${(invoice.total || 0).toFixed(2)} ` +
                 `is currently unpaid. The due date was ${dueDate}.\n\n` +
                 `Please arrange for payment at your earliest convenience.\n\n` +
                 `You can view the invoice here: [INSERT INVOICE LINK]\n\n` +
                 `Thank you for your prompt attention to this matter.\n\n` +
                 `Best regards,\n` +
                 `[Your Company Name]`;

    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  return (
    <div className={`payments-container ${darkMode ? 'dark' : ''}`}>
      <div className="payments-header">
        <h1 className={`payments-title ${darkMode ? 'dark' : ''}`}>Payment Management</h1>
        <div className={`payments-revenue-card ${darkMode ? 'dark' : ''}`}>
          <FiDollarSign size={20} className={darkMode ? 'text-white' : ''} />
          <div>
            <p className={`payments-revenue-label ${darkMode ? 'dark' : ''}`}>Collected Revenue</p>
            <p className={`payments-revenue-value ${darkMode ? 'dark' : ''}`}>
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="payments-controls">
        <div className="payments-filter-group">
          <button
            className={`payments-filter-button ${filter === 'All' ? 'active' : ''} ${darkMode ? 'dark' : ''}`}
            onClick={() => setFilter('All')}
          >
            All Payments
          </button>
          <button
            className={`payments-filter-button ${filter === 'Paid' ? 'active' : ''} ${darkMode ? 'dark' : ''}`}
            onClick={() => setFilter('Paid')}
          >
            Paid
          </button>
          <button
            className={`payments-filter-button ${filter === 'Partial' ? 'active' : ''} ${darkMode ? 'dark' : ''}`}
            onClick={() => setFilter('Partial')}
          >
            Partial
          </button>
          <button
            className={`payments-filter-button ${filter === 'Unpaid' ? 'active' : ''} ${darkMode ? 'dark' : ''}`}
            onClick={() => setFilter('Unpaid')}
          >
            Unpaid
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={`payments-loading ${darkMode ? 'dark' : ''}`}>
          <div className="payments-spinner"></div>
        </div>
      ) : (
        <div className="payments-table-container">
          <table className={`payments-table ${darkMode ? 'dark' : ''}`}>
            <thead className={`payments-table-header ${darkMode ? 'dark' : ''}`}>
              <tr>
                <th className={`payments-th ${darkMode ? 'dark' : ''}`}>Invoice #</th>
                <th className={`payments-th ${darkMode ? 'dark' : ''}`}>Client</th>
                <th className={`payments-th ${darkMode ? 'dark' : ''}`}>Amount</th>
                <th className={`payments-th ${darkMode ? 'dark' : ''}`}>Due Date</th>
                <th className={`payments-th ${darkMode ? 'dark' : ''}`}>Status</th>
                <th className={`payments-th ${darkMode ? 'dark' : ''}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id} className={`payments-tr ${darkMode ? 'dark' : ''}`}>
                  <td className={`payments-td ${darkMode ? 'dark' : ''}`}>
                    <span className={`payments-invoice-number ${darkMode ? 'dark' : ''}`}>
                      INV-{invoice.invoiceNumber}
                    </span>
                  </td>
                  <td className={`payments-td ${darkMode ? 'dark' : ''}`}>
                    <div className={`payments-client-cell ${darkMode ? 'dark' : ''}`}>
                      <p className={`payments-client-name ${darkMode ? 'dark' : ''}`}>
                        {getClientName(invoice.clientId)}
                      </p>
                      {getClientEmail(invoice.clientId) && (
                        <p className={`payments-client-email ${darkMode ? 'dark' : ''}`}>
                          {getClientEmail(invoice.clientId)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className={`payments-td payments-amount-cell ${darkMode ? 'dark' : ''}`}>
                    ${(invoice.total || 0).toFixed(2)}
                  </td>
                  <td className={`payments-td ${darkMode ? 'dark' : ''}`}>
                    {invoice.dueDate ? format(invoice.dueDate, 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className={`payments-td ${darkMode ? 'dark' : ''}`}>
                    <div className={getStatusClass(invoice.status)}>
                      {invoice.status === 'Paid' && <FiCheckCircle size={14} />}
                      {invoice.status === 'Partial' && <FiPercent size={14} />}
                      {invoice.status === 'Unpaid' && <FiClock size={14} />}
                      {invoice.status}
                    </div>
                  </td>
                  <td className={`payments-td ${darkMode ? 'dark' : ''}`}>
                    <div className="payments-action-buttons">
                      <select
                        value={invoice.status}
                        onChange={(e) => handlePaymentUpdate(invoice.id, e.target.value)}
                        className={`payments-select ${darkMode ? 'dark' : ''}`}
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partial">Partial</option>
                        <option value="Paid">Paid</option>
                      </select>
                      {invoice.status === 'Unpaid' && (
                        <button
                          className={`payments-remind-button ${darkMode ? 'dark' : ''}`}
                          onClick={() => sendReminderEmail(invoice)}
                          title="Send reminder email"
                        >
                          <FiSend size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}