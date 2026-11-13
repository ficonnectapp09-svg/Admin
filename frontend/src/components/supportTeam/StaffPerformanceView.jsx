import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Award, CheckCircle2, Clock, AlertCircle, RefreshCw,
  Search, Filter, User, ShieldCheck, ChevronRight, BarChart2
} from 'lucide-react';

export const StaffPerformanceView = ({ API_BASE, token, onToast }) => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('completionRate');

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/support-team/performance`, {
        headers: {
          'x-auth-token': token,
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPerformance(json.data || []);
      }
    } catch (err) {
      if (onToast) onToast('Failed to load performance metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const filtered = performance
    .filter(staff => {
      const matchDept = departmentFilter === 'All' || staff.department === departmentFilter;
      const matchSearch =
        !search ||
        staff.name?.toLowerCase().includes(search.toLowerCase()) ||
        staff.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
        staff.designation?.toLowerCase().includes(search.toLowerCase());
      return matchDept && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'completionRate') return b.completionRate - a.completionRate;
      if (sortBy === 'assigned') return b.assigned - a.assigned;
      if (sortBy === 'completed') return b.completed - a.completed;
      return a.name.localeCompare(b.name);
    });

  const totalAssigned = performance.reduce((sum, s) => sum + (s.assigned || 0), 0);
  const totalCompleted = performance.reduce((sum, s) => sum + (s.completed || 0), 0);
  const totalPending = performance.reduce((sum, s) => sum + (s.pending || 0), 0);
  const avgCompletion = performance.length > 0 && totalAssigned > 0
    ? Math.round((totalCompleted / totalAssigned) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Support Staff Performance & Workload
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              Database-Driven Productivity
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Objective operational efficiency metrics calculated directly from verified KYC actions, ledger approvals, and resolved tickets. Zero fabricated scores.
          </p>
        </div>

        <button
          onClick={fetchPerformance}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Performance</span>
        </button>
      </div>

      {/* Aggregate Productivity Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Assigned</span>
            <BarChart2 className="w-4 h-4 text-primary-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">
            {totalAssigned}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Work items across all teams</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Items</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {totalCompleted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Verified, settled & closed</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {totalPending}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Awaiting staff execution</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overall Completion</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {avgCompletion}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Overall throughput rate</p>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search staff name, ID or designation..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            <option value="All">All Departments</option>
            <option value="KYC Team">KYC Team</option>
            <option value="Payment Team">Payment Team</option>
            <option value="Queries Team">Queries Team</option>
            <option value="Overall">Overall Leadership</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            <option value="completionRate">Sort: Completion Rate</option>
            <option value="assigned">Sort: Total Assigned</option>
            <option value="completed">Sort: Completed Items</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Staff Performance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
            <p className="text-xs font-semibold">Calculating live productivity metrics...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold">No Staff Found</p>
            <p className="text-xs mt-1">No staff match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4 text-center">Assigned</th>
                  <th className="py-3 px-4 text-center">Completed</th>
                  <th className="py-3 px-4 text-center">Pending</th>
                  <th className="py-3 px-4">Throughput Details</th>
                  <th className="py-3 px-4">Completion Rate</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map(staff => (
                  <tr key={staff.employeeId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                      <div>{staff.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{staff.employeeId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        staff.department === 'KYC Team'
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          : staff.department === 'Payment Team'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : staff.department === 'Queries Team'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                      }`}>
                        {staff.department}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{staff.designation}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-white">
                      {staff.assigned}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {staff.completed}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                      {staff.pending}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      {staff.department === 'KYC Team' && (
                        <div className="space-y-0.5">
                          <span className="text-emerald-600 font-semibold">{staff.approved} Apprv</span> /{' '}
                          <span className="text-rose-600 font-semibold">{staff.rejected} Rej</span> /{' '}
                          <span className="text-amber-600 font-semibold">{staff.reuploads} Re-up</span>
                        </div>
                      )}
                      {staff.department === 'Payment Team' && (
                        <div>
                          <span className="font-semibold text-emerald-600">{staff.completed}</span> Ledger Txns Processed
                        </div>
                      )}
                      {staff.department === 'Queries Team' && (
                        <div>
                          <span className="font-semibold text-emerald-600">{staff.completed}</span> Tickets Resolved
                        </div>
                      )}
                      {staff.department === 'Overall' && (
                        <div className="text-slate-400 italic">Department Supervision</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-36 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{staff.completionRate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              staff.completionRate >= 80
                                ? 'bg-emerald-500'
                                : staff.completionRate >= 50
                                ? 'bg-amber-500'
                                : 'bg-primary-500'
                            }`}
                            style={{ width: `${Math.min(staff.completionRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        staff.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      }`}>
                        {staff.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

