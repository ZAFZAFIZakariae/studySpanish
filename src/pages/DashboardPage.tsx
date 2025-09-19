import React from 'react';
import { Dashboard } from '../components/Dashboard';

const DashboardPage: React.FC = () => (
  <section className="space-y-4" aria-labelledby="dashboard-page-heading">
    <h1 id="dashboard-page-heading" className="text-2xl font-bold">
      Progress dashboard
    </h1>
    <Dashboard />
  </section>
);

export default DashboardPage;
