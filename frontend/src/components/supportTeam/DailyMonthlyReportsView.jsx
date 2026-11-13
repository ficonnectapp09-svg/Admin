import React, { useState, useEffect } from 'react';
import {
  FileText, Calendar, Download, RefreshCw, CheckCircle2,
  AlertTriangle, DollarSign, ShieldCheck, ArrowUpRight, TrendingUp
} from 'lucide-react';

export const DailyMonthlyReportsView = ({ API_BASE, token, onToast }) => {
  const [range, setRange] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/admin/support-team/reports`);
      url.searchParams.append('range', range);
      if (range === 'custom' && customStart && customEnd) {
        url.searchParams.append('customStart', customStart);
        url.searchParams.append('customEnd', customEnd);
      }

      const res = await fetch(url.toString(), {
        headers: {
          'x-auth-token': token,
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setReport(json.data);
      }
    } catch (err) {
      if (onToast) onToast('Failed to load support team report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (range !== 'custom' || (customStart && customEnd)) {
      fetchReport();
    }
  }, [range]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Support Operations Daily & Monthly Reports
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 border border-primary-500/20">
              Audit-Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Aggregated operational throughput, financial ledger reconciliation, and service resolution metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export / Print</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'previous_month', label: 'Previous Month' },
            { id: 'custom', label: 'Custom Range' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                range === r.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200"
            />
            <button
              onClick={fetchReport}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-xl text-xs font-bold"
            >
              Apply
            </button>
          </div>
        )}

        {report && (
          <div className="text-[11px] text-slate-400 font-medium">
            Reporting Period:{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {new Date(report.startDate).toLocaleDateString()} – {new Date(report.endDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-16 rounded-3xl text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
          <p className="text-xs font-semibold">Generating audit report from database collections...</p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Active Staff</span>
              <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                {report.staffCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across 3 departments</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">KYC Requests</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {report.kyc.totalRequests}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {report.kyc.approved} Approved / {report.kyc.rejected} Rejected
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ledger Net Revenue</span>
              <div className={`text-2xl font-black mt-1 ${
                report.ledger.netRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                ₹{report.ledger.netRevenue?.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{report.ledger.totalTxns} Transactions logged</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Queries Resolved</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {report.queries.resolved} / {report.queries.totalTickets}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {report.queries.totalTickets > 0
                  ? `${Math.round((report.queries.resolved / report.queries.totalTickets) * 100)}% Resolution Rate`
                  : 'No tickets in period'}
              </p>
            </div>
          </div>

          {/* Department Deep-Dive Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KYC Department Summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">KYC Department</h4>
                    <p className="text-[10px] text-slate-400">Verification Throughput</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500">Submitted Requests</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{report.kyc.totalRequests}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-emerald-600">Approved</span>
                  <span className="font-bold text-emerald-600">{report.kyc.approved}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-rose-600">Rejected</span>
                  <span className="font-bold text-rose-600">{report.kyc.rejected}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-amber-600">Re-upload Requested</span>
                  <span className="font-bold text-amber-600">{report.kyc.reuploads}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Pending Review</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{report.kyc.pending}</span>
                </div>
              </div>
            </div>

            {/* Payment & Financial Ledger Summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Payment & Ledger</h4>
                    <p className="text-[10px] text-slate-400">Financial Isolation Audited</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500">Total Transactions</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{report.ledger.totalTxns}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-emerald-600">Income</span>
                  <span className="font-bold text-emerald-600">₹{report.ledger.totalIncome?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-rose-600">Expenses</span>
                  <span className="font-bold text-rose-600">₹{report.ledger.totalExpenses?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-indigo-600">Agent Deposit Liabilities</span>
                  <span className="font-bold text-indigo-600">₹{report.ledger.agentDepositLiabilities?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Net Operational Revenue</span>
                  <span className="font-black text-emerald-600">₹{report.ledger.netRevenue?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Queries Department Summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Queries & Support</h4>
                    <p className="text-[10px] text-slate-400">Customer Issue Resolution</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500">Total Tickets</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{report.queries.totalTickets}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-emerald-600">Resolved / Closed</span>
                  <span className="font-bold text-emerald-600">{report.queries.resolved}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-blue-600">Open Tickets</span>
                  <span className="font-bold text-blue-600">{report.queries.open}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-amber-600">In Progress</span>
                  <span className="font-bold text-amber-600">{report.queries.inProgress}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-rose-600">Escalated / SLA Breached</span>
                  <span className="font-bold text-rose-600">{report.queries.escalated + report.queries.slaBreached}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

