import React from 'react';
import AdminPanel from '../../components/Admin/AdminPanel';

export const AdminRBACPage: React.FC = () => {
  return <AdminPanel initialTab="rbac" hideLayoutNav={true} />;
};

export default AdminRBACPage;
