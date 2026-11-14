import React from 'react';
import AdminPanel from '../../components/Admin/AdminPanel';

export const AdminBrandingPage: React.FC = () => {
  return <AdminPanel initialTab="branding" hideLayoutNav={true} />;
};

export default AdminBrandingPage;
