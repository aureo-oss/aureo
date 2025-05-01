import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function EmailReminderButton({ invoice, client }) {
  const subject = `Invoice ${invoice.number} Reminder`;
  const body = `Hi ${client.name},\n\n` +
               `This is a reminder that invoice ${invoice.number} ` +
               `for $${invoice.total} is due on ${invoice.dueDate}.\n\n` +
               `Payment link: https://yourdomain.com/pay/${invoice.id}\n\n` +
               `Thank you!`;

  const handleClick = () => {
    updateDoc(doc(db, 'invoices', invoice.id), {
      lastReminderSent: new Date().toISOString()
    });
  };

  return (
    <a
      href={`mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
      className="email-button"
      onClick={handleClick}
    >
      📧 Send Reminder
    </a>
  );
}