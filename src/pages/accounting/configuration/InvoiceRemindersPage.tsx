import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const InvoiceRemindersPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Configuration', href: '/accounting/configuration/settings' },
        { label: 'Invoice Reminders' }
      ]}
      title="Automated Payment Follow-ups & Reminders"
      badge="Dunning"
      entityName="Reminder Level"
      initialData={[
        { id: 1, reference: 'Level 1: Gentle Due Date Reminder', partner: 'Sent 3 days before invoice due date (Email & WhatsApp)', date: '2026-01-01', amount: 'Automated', status: 'Active' },
        { id: 2, reference: 'Level 2: Due Date Alert', partner: 'Sent on exact due date (Email with Payment Link)', date: '2026-01-01', amount: 'Automated', status: 'Active' },
        { id: 3, reference: 'Level 3: Overdue Escalation 15 Days', partner: 'Sent 15 days past due date (Cc: Sales Rep & Accounts)', date: '2026-01-01', amount: 'Automated', status: 'Active' },
        { id: 4, reference: 'Level 4: Formal Legal Notice 30 Days', partner: 'Formal notice and temporary account credit freeze', date: '2026-01-01', amount: 'Automated', status: 'Active' }
      ]}
      emptyDescription="Automated dunning levels, overdue debt collection schedules, automated SMS/Email triggers, and credit hold rules."
    />
  );
};

export default InvoiceRemindersPage;
