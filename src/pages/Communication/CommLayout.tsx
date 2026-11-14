import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { CommProvider, useComm } from './context/CommContext';
import { CommSidebar } from './components/CommSidebar';
import { ThreadSidePanel } from './components/ThreadSidePanel';

const CommLayoutInner: React.FC = () => {
  const { activeThread } = useComm();
  const location = useLocation();

  // If at root /comm, redirect to default channel
  if (location.pathname === '/comm' || location.pathname === '/comm/') {
    return <Navigate to="/comm/channels/1" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
      {/* Slack-style Left Navigation Sidebar */}
      <CommSidebar />

      {/* Main Chat/Activity/Settings View */}
      <div className="flex-1 flex min-w-0 h-full overflow-hidden">
        <Outlet />
      </div>

      {/* Slack-style Right Thread Side Drawer */}
      {activeThread && <ThreadSidePanel />}
    </div>
  );
};

export const CommLayout: React.FC = () => {
  return (
    <CommProvider>
      <CommLayoutInner />
    </CommProvider>
  );
};
