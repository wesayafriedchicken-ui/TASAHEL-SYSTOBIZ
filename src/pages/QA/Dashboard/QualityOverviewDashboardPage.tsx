import React from 'react';
import { QualityOverviewDashboard } from '../../../components/QA/QualityOverviewDashboard';

export const QualityOverviewDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-overview-dashboard-page">
      <QualityOverviewDashboard />
    </div>
  );
};

export default QualityOverviewDashboardPage;
