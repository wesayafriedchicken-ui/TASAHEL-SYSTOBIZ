import React from 'react';
import AdminPanel from '../../components/Admin/AdminPanel';

export const AdminOrgChartPage: React.FC = () => {
  return <AdminPanel initialTab="org" hideLayoutNav={true} />;
};

export default AdminOrgChartPage;
