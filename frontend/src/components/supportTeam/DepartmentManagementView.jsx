import React, { useState } from 'react';
import {
  Layers, ShieldCheck, DollarSign, Headphones, ArrowRight
} from 'lucide-react';
import { KycDepartmentDashboard } from './KycDepartmentDashboard';
import { PaymentDepartmentDashboard } from './PaymentDepartmentDashboard';
import { QueriesDepartmentDashboard } from './QueriesDepartmentDashboard';

export const DepartmentManagementView = ({ API_BASE, token, onToast, initialDept = 'KYC' }) => {
  const [activeDept, setActiveDept] = useState(initialDept);

  return (
    <div className="space-y-6">
      {/* Department Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveDept('KYC')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeDept === 'KYC'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>KYC Department</span>
        </button>

        <button
          onClick={() => setActiveDept('PAYMENT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeDept === 'PAYMENT'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Payment Department</span>
        </button>

        <button
          onClick={() => setActiveDept('QUERIES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeDept === 'QUERIES'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Queries Department</span>
        </button>
      </div>

      {/* Render Active Department Dashboard */}
      {activeDept === 'KYC' && (
        <KycDepartmentDashboard API_BASE={API_BASE} token={token} onToast={onToast} />
      )}
      {activeDept === 'PAYMENT' && (
        <PaymentDepartmentDashboard API_BASE={API_BASE} token={token} onToast={onToast} />
      )}
      {activeDept === 'QUERIES' && (
        <QueriesDepartmentDashboard API_BASE={API_BASE} token={token} onToast={onToast} />
      )}
    </div>
  );
};

