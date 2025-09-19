import React from 'react';
import { Link } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';

const DashboardPage: React.FC = () => (
  <section className="space-y-6" aria-labelledby="dashboard-page-heading">
    <header className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Analytics</p>
      <h1 id="dashboard-page-heading" className="text-3xl font-bold text-slate-900">
        Progress dashboard
      </h1>
      <p className="text-sm text-slate-600">
        Review accuracy, speed, and recommended exercises after each session so you can adjust the next study
        block with confidence.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link to="/" className="text-sm font-semibold text-blue-700 underline focus-visible:ring">
          ← Back to overview
        </Link>
        <Link to="/flashcards" className="text-sm font-semibold text-blue-700 underline focus-visible:ring">
          Drill due flashcards
        </Link>
      </div>
    </header>
    <Dashboard />
  </section>
);

export default DashboardPage;
