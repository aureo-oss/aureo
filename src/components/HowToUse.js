// components/HowToUse.js
import React from 'react';

export default function HowToUse() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">How to Use Aureo</h1>
      <div className="space-y-6">
        <div className="step">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">1. Creating Events</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Navigate to the Events tab to create new events. Fill in event details
            and save to manage all related activities.
          </p>
        </div>
        
        <div className="step">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">2. Managing Clients</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Use the Clients section to add and organize client information.
            All client-related documents and history are stored here.
          </p>
        </div>

        <div className="step">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">3. Generating Invoices</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create invoices from templates in the Invoices section. 
            Customize and send directly to clients with payment tracking.
          </p>
        </div>
      </div>
    </div>
  );
}