import React from 'react';
import {
  Users, UserCheck, ShieldCheck, DollarSign, Headphones, Clock, CheckCircle2,
  XCircle, AlertTriangle, ArrowRight, TrendingUp, RefreshCw, Layers, Award
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

export const SupportOverviewView = ({ data, loading, onRefresh, onNavigateTab }) => {
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mr-3" />
        <span className="text-sm font-bold">Loading Centralized Support Overview...</span>
      </div>
    );
  }

  const staff = data?.staff || {};
  const depts = data?.departments || {};
  const kyc = depts.kyc || {};
  const payment = depts.payment || {};
  const queries = depts.queries || {};

  const totalRequestsReceived = (kyc.received || 0) + (payment.totalTransactions || 0) + (queries.received || 0);
  const totalCompleted = (kyc.completed || 0) + (payment.completedApprovals || 0) + (queries.resolved || 0);
  const totalPending = (kyc.pending || 0) + (payment.pendingCheckerApprovals || 0) + (queries.pending || 0);

  // Comparison chart data
  const chartData = [
    {
      name: 'KYC Team',
      Received: kyc.received || 0,
      Pending: kyc.pending || 0,
      Completed: kyc.completed || 0
    },
    {
      name: 'Payment Team',
      Received: payment.totalTransactions || 0,
      Pending: payment.pendingCheckerApprovals || 0,
      Completed: payment.completedApprovals || 0
    },
    {
      name: 'Queries Team',
      Received: queries.received || 0,
      Pending: queries.pending || 0,
      Completed: queries.resolved || 0
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header with Live Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Support Team Centralized Overview
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Super Admin View
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Real-time multi-department monitoring across KYC, Payment, and Queries operations.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 2. Overall Staff Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Overall Staff Hierarchy Summary
          </span>
          <button
            onClick={() => onNavigateTab('support-staff-management')}
            className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-1"
          >
            <span>Manage Staff Hierarchy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Staff</span>
            <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{staff.totalStaff || 0}</div>
            <span className="text-[10px] text-slate-500">All Levels</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Support Lead</span>
            <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1 truncate">
              {staff.supportLead?.name || 'Assigned'}
            </div>
            <span className="text-[10px] font-mono text-slate-400">{staff.supportLead?.employeeId || 'LEVEL 2'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Dept Leads</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{staff.totalDeptLeads || 3}</div>
            <span className="text-[10px] text-slate-500">KYC, Pay, Qry</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Employees</span>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">{staff.totalEmployees || 0}</div>
            <span className="text-[10px] text-slate-500">Staff Specialists</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Active Accounts</span>
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{staff.activeStaff || 0}</div>
            <span className="text-[10px] text-slate-500">{staff.inactiveStaff || 0} Inactive</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400">Present Today</span>
            <div className="text-2xl font-black text-amber-500 mt-1">{staff.presentToday || 0}</div>
            <span className="text-[10px] text-slate-500">{staff.absentToday || 0} Absent</span>
          </div>
        </div>
      </div>

      {/* 3. Overall Work Summary Metrics */}
      <div>
        <div className="mb-3 px-1 text-[11px] font-black uppercase tracking-wider text-slate-400">
          Combined Operations Summary
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40">
            <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Total Work Inflow</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalRequestsReceived}</div>
            <span className="text-[10px] text-slate-500">Across 3 Departments</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40">
            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Pending Execution</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{totalPending}</div>
            <span className="text-[10px] text-slate-500">Requires Action</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Completed Work</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalCompleted}</div>
            <span className="text-[10px] text-slate-500">Processed & Closed</span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40">
            <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">Workload Resolution Rate</span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {totalRequestsReceived > 0 ? Math.round((totalCompleted / totalRequestsReceived) * 100) : 0}%
            </div>
            <span className="text-[10px] text-slate-500">Overall Efficiency</span>
          </div>
        </div>
      </div>

      {/* 4. Three Independent Department Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KYC TEAM CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">KYC Team</h3>
                  <div className="text-[11px] text-slate-400">Lead: {kyc.lead?.name || 'Priya Sundaram'}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600">
                {kyc.staffCount || 2} Staff
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Requests Received</span>
                <div className="font-black text-base text-slate-800 dark:text-white mt-0.5">{kyc.received || 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                <span className="text-[10px] font-bold uppercase">Pending Verification</span>
                <div className="font-black text-base mt-0.5">{kyc.pending || 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <span className="text-[10px] font-bold uppercase">Approved</span>
                <div className="font-black text-base mt-0.5">{kyc.approved || 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
                <span className="text-[10px] font-bold uppercase">Rejected</span>
                <div className="font-black text-base mt-0.5">{kyc.rejected || 0}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('support-kyc-team')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold text-xs transition-colors"
          >
            <span>Open KYC Operations Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* PAYMENT TEAM CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">Payment Team</h3>
                  <div className="text-[11px] text-slate-400">Lead: {payment.lead?.name || 'Vikramaditya Verma'}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                {payment.staffCount || 2} Staff
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Recognized Income</span>
                <div className="font-black text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ₹{Number(payment.recognizedIncomeTotal || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Qualifying Expenses</span>
                <div className="font-black text-sm text-rose-500 mt-0.5">
                  ₹{Number(payment.qualifyingExpensesTotal || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
                <span className="text-[10px] font-bold uppercase">Agent Deposit Liability</span>
                <div className="font-black text-sm mt-0.5">
                  ₹{Number(payment.agentDepositLiabilitiesTotal || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                <span className="text-[10px] font-bold uppercase">Pending Checker</span>
                <div className="font-black text-base mt-0.5">{payment.pendingCheckerApprovals || 0}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('support-payment-team')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 font-bold text-xs transition-colors"
          >
            <span>Open Payment Operations Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* QUERIES TEAM CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">Queries Team</h3>
                  <div className="text-[11px] text-slate-400">Lead: {queries.lead?.name || 'Ananya Deshmukh'}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600">
                {queries.staffCount || 2} Staff
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Queries Received</span>
                <div className="font-black text-base text-slate-800 dark:text-white mt-0.5">{queries.received || 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                <span className="text-[10px] font-bold uppercase">Pending Queries</span>
                <div className="font-black text-base mt-0.5">{queries.pending || 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <span className="text-[10px] font-bold uppercase">Resolved Cases</span>
                <div className="font-black text-base mt-0.5">{queries.resolved || 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                <span className="text-[10px] font-bold uppercase">Transferred Cases</span>
                <div className="font-black text-base mt-0.5">{queries.transferred || 0}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('support-queries-team')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-300 font-bold text-xs transition-colors"
          >
            <span>Open Queries Operations Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. Department Workload Comparison Bar Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
              Department Operations & Workload Comparison
            </h3>
            <p className="text-xs text-slate-400">
              Comparative volume of tasks received, pending execution, and successfully completed.
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  fontSize: '11px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Received" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Completed" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

