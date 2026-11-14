import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QAIntegrationSettingsModal } from '../../../components/QA/QAIntegrationSettingsModal';

export const QASettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/qa/transactions-audit');
  };

  return (
    <div className="animate-fadeIn py-2" id="qa-settings-page">
      <QAIntegrationSettingsModal
        isPage={true}
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleClose}
      />
    </div>
  );
};

export default QASettingsPage;
