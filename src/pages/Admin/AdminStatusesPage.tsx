import React from 'react';
import AdminPanel from '../../components/Admin/AdminPanel';

export const AdminStatusesPage: React.FC = () => {
  return <AdminPanel initialTab="statuses" hideLayoutNav={true} />;
};

export default AdminStatusesPage;
