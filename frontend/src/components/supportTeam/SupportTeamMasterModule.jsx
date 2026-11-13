import React from 'react';
import {
  LayoutDashboard, Users, Layers, ShieldCheck, DollarSign,
  Headphones, Activity, Calendar, Award, FileText
} from 'lucide-react';
import { SupportOverviewView } from './SupportOverviewView';
import { StaffHierarchyManagementView } from './StaffHierarchyManagementView';
import { DepartmentManagementView } from './DepartmentManagementView';
import { KycDepartmentDashboard } from './KycDepartmentDashboard';
import { PaymentDepartmentDashboard } from './PaymentDepartmentDashboard';
import { QueriesDepartmentDashboard } from './QueriesDepartmentDashboard';
import { ActivityMonitoringView } from './ActivityMonitoringView';
import { AttendanceMonitoringView } from './AttendanceMonitoringView';
import { StaffPerformanceView } from './StaffPerformanceView';
import { DailyMonthlyReportsView } from './DailyMonthlyReportsView';

export const SupportTeamMasterModule = ({
  activeTab = 'support-overview',
  setActiveTab,
  API_BASE,
  token,
  onToast
}) => {
  const tabs = [
    { id: 'support-overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'support-staff-management', label: 'Staff Management', icon: Users },
    { id: 'support-dept-management', label: 'Departments', icon: Layers },
    { id: 'support-kyc-team', label: 'KYC Team', icon: ShieldCheck },
    { id: 'support-payment-team', label: 'Payment Team', icon: DollarSign },
    { id: 'support-queries-team', label: 'Queries Team', icon: Headphones },
    { id: 'support-activities-monitoring', label: 'Activities', icon: Activity },
    { id: 'support-attendance', label: 'Attendance', icon: Calendar },
    { id: 'support-staff-performance', label: 'Performance', icon: Award },
    { id: 'support-reports', label: 'Reports', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar for Quick Switching Across Support Views */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm flex items-center gap-1.5 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab && setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab View Rendering */}
      {activeTab === 'support-overview' && (
        <SupportOverviewView
          API_BASE={API_BASE}
          token={token}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'support-staff-management' && (
        <StaffHierarchyManagementView
          API_BASE={API_BASE}
          token={token}
          onToast={onToast}
        />
      )}

      {activeTab === 'support-dept-management' && (
        <DepartmentManagementView
          API_BASE={API_BASE}
          token={token}
          onToast={onToast}
          initialDept="KYC"
        />
      )}

      {activeTab === 'support-kyc-team' && (
        <KycDepartmentDashboard
          API_BASE={API_BASE}
          token={token}
          onToast={onToast}
        />
      )}

      {activeTab === 'support-payment-team' && (
        <PaymentDepartmentDashboard
          API_BASE={API_BASE}
          token={token}
          onToast={onToast}
        />
      )}

      {activeTab === 'support-queries-team' && (
        <QueriesDepartmentDashboard
          API_BASE={API_BASE}
          token={token}
          onToast={onToast}
        />
      )}

      {activeTab === 'support-activities-monitoring' && (
        <ActivityMonitoringView
          API_BASE={API_BASE}
          token={token}
          onToast={onToast}
        />
      )}

      {activeTab === 'support-attendance' && (
        <AttendanceMonitoringView
          API_BASE={API_BASE}
          token={token}
          onToast={onToast}
        />
      )}

      {activeTab === 'support-staff-performance' && (
        <StaffPerformanceView
          API_BASE={API_BASE}
          token={token}
          onToast={onToast}
        />
      )}

      {activeTab === 'support-reports' && (
        <DailyMonthlyReportsView
          API_BASE={API_BASE}
          token={token}
          onToast={onToast}
        />
      )}
    </div>
  );
};

export default SupportTeamMasterModule;
