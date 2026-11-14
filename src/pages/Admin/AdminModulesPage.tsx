import React from 'react';
import AdminPanel from '../../components/Admin/AdminPanel';

export const AdminModulesPage: React.FC = () => {
  return <AdminPanel initialTab="modules" hideLayoutNav={true} />;
};

export default AdminModulesPage;
