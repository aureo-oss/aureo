import EmailReminderButton from '../EmailReminderButton';

function InvoiceList() {
  // ... your existing code ...
  
  return (
    <div className="invoice-list">
      {invoices.map(invoice => {
        const client = clients.find(c => c.id === invoice.clientId);
        return (
          <div key={invoice.id} className="invoice-card">
            <h3>Invoice #{invoice.number}</h3>
            <p>Amount: ${invoice.total}</p>
            <p>Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
            <EmailReminderButton invoice={invoice} client={client} />
          </div>
        );
      })}
    </div>
  );
}