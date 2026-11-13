import React, { useState, useEffect } from 'react';
import {
  Headphones, RefreshCw, Search, Filter, CheckCircle2, Clock,
  ArrowRight, AlertCircle, Share2, MessageSquare, User
} from 'lucide-react';

export const QueriesDepartmentDashboard = ({ API_BASE, token, onToast }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const fetchQueriesStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/support-team/queries/stats`, {
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
      if (onToast) onToast('Failed to load Queries statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueriesStats();
  }, []);

  const statusCounts = data?.statusCounts || {};
  const categoryStats = data?.categoryStats || {};
  const recentQueries = data?.recentQueries || [];

  const categories = [
    'All',
    'Customer',
    'Vendor',
    'Agent',
    'Manager',
    'Sub Admin',
    'Delivery Partner',
    'Technician',
    'Internal'
  ];

  const filteredQueries = recentQueries.filter(q => {
    const matchCat =
      activeCategory === 'All' ||
      q.sourceType === activeCategory ||
      (activeCategory === 'Internal' && q.isInternal);

    const matchSearch =
      !search ||
      q.queryId?.toLowerCase().includes(search.toLowerCase()) ||
      q.subject?.toLowerCase().includes(search.toLowerCase()) ||
      q.raisedByName?.toLowerCase().includes(search.toLowerCase());

    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Queries Team Department Dashboard
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
              Department Operations
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Monitoring support ticket resolution across 8 categories, inter-department transfers, and SLA response times.
          </p>
        </div>

        <button
          onClick={fetchQueriesStats}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queries</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Queries</span>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{data?.totalQueries || 0}</div>
          <span className="text-[10px] text-slate-500">8 Categories</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-blue-500">New / Unassigned</span>
          <div className="text-2xl font-black text-blue-500 mt-1">{statusCounts.new || 0}</div>
          <span className="text-[10px] text-slate-500">Incoming Queue</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-amber-500">Assigned / In Progress</span>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {(statusCounts.assigned || 0) + (statusCounts.inProgress || 0)}
          </div>
          <span className="text-[10px] text-slate-500">Active Investigation</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-emerald-500">Resolved & Closed</span>
          <div className="text-2xl font-black text-emerald-500 mt-1">
            {(statusCounts.resolved || 0) + (statusCounts.closed || 0)}
          </div>
          <span className="text-[10px] text-slate-500">Completed Cases</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-indigo-500">Waiting Response</span>
          <div className="text-2xl font-black text-indigo-500 mt-1">{statusCounts.waiting || 0}</div>
          <span className="text-[10px] text-slate-500">Client Clarification</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-rose-500">Overdue SLA</span>
          <div className="text-2xl font-black text-rose-500 mt-1">{statusCounts.overdue || 0}</div>
          <span className="text-[10px] text-slate-500">Action Required</span>
        </div>
      </div>

      {/* 8 Category Category Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Query Inflow by Stakeholder Category
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map(cat => {
            const isSelected = activeCategory === cat;
            const cnt = cat === 'All' ? data?.totalQueries : categoryStats[cat]?.total || 0;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md'
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

      {/* Queries Table with Department Transfers */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Support Case Queue & Department Transfers
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search query ID or subject..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Case ID & Subject</th>
                <th className="py-3 px-3">Originating Category</th>
                <th className="py-3 px-3">Assigned Executive</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Department Transfer</th>
                <th className="py-3 px-3 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQueries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No support cases found matching the active category.
                  </td>
                </tr>
              ) : (
                filteredQueries.map(q => (
                  <tr key={q.queryId || q._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-800 dark:text-white">{q.subject}</div>
                      <div className="font-mono text-[10px] text-slate-400">{q.queryId} • {q.raisedByName || 'Client'}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {q.sourceType || 'Customer'}
                    </td>
                    <td className="py-3 px-3">
                      {q.assignedEmployeeName ? (
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{q.assignedEmployeeName}</div>
                          <div className="font-mono text-[10px] text-slate-400">{q.assignedEmployeeId}</div>
                        </div>
                      ) : (
                        <span className="text-amber-500 italic font-semibold">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.status === 'Resolved' || q.status === 'Closed' ? 'bg-emerald-500/10 text-emerald-600' :
                        q.status === 'Overdue' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      {q.transfers && q.transfers.length > 0 ? (
                        <div className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          <span>Transferred to {q.transfers[q.transfers.length - 1].toDepartment}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None (Queries Dept)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'N/A'}
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

