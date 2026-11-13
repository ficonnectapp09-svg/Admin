import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, RefreshCw, Search, Filter, CheckCircle2, XCircle, Clock,
  FileText, ArrowRight, UserCheck, AlertTriangle
} from 'lucide-react';

export const KycDepartmentDashboard = ({ API_BASE, token, onToast }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const fetchKycStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/support-team/kyc/stats`, {
        headers: {
          'x-auth-token': token,
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      }
    } catch (err) {
      if (onToast) onToast('Failed to load KYC statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStats();
  }, []);

  const statusCounts = data?.statusCounts || {};
  const categoryStats = data?.categoryStats || {};
  const recentRequests = data?.recentRequests || [];

  const categories = [
    'All',
    'Customer',
    'Vendor',
    'Agent',
    'Manager',
    'Sub Admin',
    'Delivery Partner',
    'Technician',
    'KYC Team Employee',
    'Payment Team Employee',
    'Queries Team Employee'
  ];

  const filteredRequests = recentRequests.filter(r => {
    const matchCat = activeCategory === 'All' || r.applicantType === activeCategory;
    const matchSearch =
      !search ||
      r.applicantName?.toLowerCase().includes(search.toLowerCase()) ||
      r.requestId?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              KYC Team Department Dashboard
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
              Department Operations
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Monitoring applicant verification across 10 distinct categories, assignment queues, and approval attribution.
          </p>
        </div>

        <button
          onClick={fetchKycStats}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh KYC Queue</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Requests</span>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{data?.totalRequests || 0}</div>
          <span className="text-[10px] text-slate-500">10 Categories</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-amber-500">Unassigned Queue</span>
          <div className="text-2xl font-black text-amber-500 mt-1">{statusCounts.unassigned || 0}</div>
          <span className="text-[10px] text-slate-500">Awaiting Specialist</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-blue-500">Assigned / In Progress</span>
          <div className="text-2xl font-black text-blue-500 mt-1">
            {(statusCounts.assigned || 0) + (statusCounts.inProgress || 0)}
          </div>
          <span className="text-[10px] text-slate-500">Under Review</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-emerald-500">Verified & Approved</span>
          <div className="text-2xl font-black text-emerald-500 mt-1">{statusCounts.approved || 0}</div>
          <span className="text-[10px] text-slate-500">Completed KYC</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-rose-500">Rejected</span>
          <div className="text-2xl font-black text-rose-500 mt-1">{statusCounts.rejected || 0}</div>
          <span className="text-[10px] text-slate-500">With Mandatory Reason</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-purple-500">Re-upload Requested</span>
          <div className="text-2xl font-black text-purple-500 mt-1">{statusCounts.reupload || 0}</div>
          <span className="text-[10px] text-slate-500">Applicant Action Req.</span>
        </div>
      </div>

      {/* 10 Category Quick Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Applicant Category Volume Breakdown
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map(cat => {
            const isSelected = activeCategory === cat;
            const cnt = cat === 'All' ? data?.totalRequests : categoryStats[cat]?.total || 0;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/20">
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Requests & Approval Attribution Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            KYC Request Queue & Verification Attribution
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search applicant or ID..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Applicant & ID</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Assigned Specialist</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Official Attribution</th>
                <th className="py-3 px-3 text-right">Submission Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No KYC requests found matching filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(r => (
                  <tr key={r.requestId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-800 dark:text-white">{r.applicantName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{r.requestId}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {r.applicantType}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {r.assignedEmployeeName ? (
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{r.assignedEmployeeName}</div>
                          <div className="font-mono text-[10px]">{r.assignedEmployeeId}</div>
                        </div>
                      ) : (
                        <span className="text-amber-500 italic font-semibold">Unassigned Queue</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600' :
                        r.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600' :
                        r.status === 'Re-upload Requested' ? 'bg-purple-500/10 text-purple-600' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      {r.status === 'Approved' && r.approvedBy ? (
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Approved by <span className="font-bold">{r.approvedBy.name}</span> ({r.approvedBy.employeeId})
                        </div>
                      ) : r.status === 'Rejected' && r.rejectedBy ? (
                        <div className="text-rose-600 dark:text-rose-400 font-medium">
                          Rejected by <span className="font-bold">{r.rejectedBy.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending Decision</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                      {r.submissionDate ? new Date(r.submissionDate).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

