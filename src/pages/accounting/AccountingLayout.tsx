import React from 'react';
import { Outlet } from 'react-router-dom';
import AccountingNavbar from './AccountingNavbar';

export const AccountingLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Persistent Top Navigation Bar */}
      <AccountingNavbar />

      {/* Main Routed Content Area */}
      <div className="flex-1 w-full flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

export default AccountingLayout;
