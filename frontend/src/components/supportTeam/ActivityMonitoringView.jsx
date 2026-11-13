import React, { useState, useEffect } from 'react';
import {
  Activity, RefreshCw, Search, Filter, Shield, Clock, User, CheckCircle2,
  XCircle, AlertTriangle, ArrowRight
} from 'lucide-react';

export const ActivityMonitoringView = ({ API_BASE, token, onToast }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/admin/support-team/activities`);
      if (departmentFilter !== 'All') url.searchParams.append('department', departmentFilter);

      const res = await fetch(url.toString(), {
        headers: {
          'x-auth-token': token,
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActivities(json.data || []);
      }
    } catch (err) {
      if (onToast) onToast('Failed to load activity logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [departmentFilter]);

  const filtered = activities.filter(act => {
    const matchSearch =
      !search ||
      act.action?.toLowerCase().includes(search.toLowerCase()) ||
      act.actorName?.toLowerCase().includes(search.toLowerCase()) ||
      act.targetId?.toLowerCase().includes(search.toLowerCase()) ||
      (typeof act.details === 'string' && act.details.toLowerCase().includes(search.toLowerCase()));

    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Support Team Activity & Audit Monitoring
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              Live Audit Stream
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Real-time chronological events from audit logs: verifications, approvals, rejections, escalations, and onboarding.
          </p>
        </div>

        <button
          onClick={fetchActivities}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Activity Stream</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search action, actor, target ID..."
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
              <option value="Overall">Overall</option>
            </select>
          </div>
        </div>

        {/* Audit Stream Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Actor (Employee)</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 px-3">Target ID</th>
                <th className="py-3 px-3">Audit Details / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No activity logs recorded matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((act, i) => (
                  <tr key={act._id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {act.timestamp ? new Date(act.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 dark:text-white">{act.actorName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{act.actorRole} • {act.actorId}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        act.action?.includes('APPROVE') ? 'bg-emerald-500/10 text-emerald-600' :
                        act.action?.includes('REJECT') ? 'bg-rose-500/10 text-rose-600' :
                        act.action?.includes('ONBOARD') ? 'bg-blue-500/10 text-blue-600' :
                        'bg-purple-500/10 text-purple-600'
                      }`}>
                        {act.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {act.targetId || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-[11px] max-w-md">
                      {typeof act.details === 'object' ? JSON.stringify(act.details) : act.details || 'Action completed'}
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

