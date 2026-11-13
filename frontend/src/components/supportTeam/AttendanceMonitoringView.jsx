import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Search, Filter, User, Building2, MapPin
} from 'lucide-react';

export const AttendanceMonitoringView = ({ API_BASE, token, onToast }) => {
  const [data, setData] = useState({ totalRecords: 0, present: 0, absent: 0, leave: 0, records: [] });
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/admin/support-team/attendance`);
      if (departmentFilter !== 'All') url.searchParams.append('department', departmentFilter);

      const res = await fetch(url.toString(), {
        headers: {
          'x-auth-token': token,
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data || { totalRecords: 0, present: 0, absent: 0, leave: 0, records: [] });
      }
    } catch (err) {
      if (onToast) onToast('Failed to load attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [departmentFilter]);

  const filteredRecords = (data.records || []).filter(rec => {
    const matchSearch =
      !search ||
      rec.staffName?.toLowerCase().includes(search.toLowerCase()) ||
      rec.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      rec.department?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Support Team Attendance & Shift Logs
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Live Punch Logs
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Real-time daily attendance, active work hours, punch times, and leave records across all 3 departments.
          </p>
        </div>

        <button
          onClick={fetchAttendance}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Attendance</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Entries</span>
            <Calendar className="w-4 h-4 text-primary-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">
            {data.totalRecords}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Logged shift records</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {data.present}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Active & checked in</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Absent</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {data.absent}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Unexcused absence</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">On Leave</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {data.leave}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Approved leaves</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee name, ID or department..."
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
          </select>
        </div>
      </div>

      {/* Attendance Table / Clean Database Empty State */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
            <p className="text-xs font-semibold">Loading live attendance records from database...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Calendar className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">
              No Attendance Records in Database
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
              No punch-in entries found in the <code className="text-primary-500 font-mono">backoffice_attendance</code> collection for this period. Attendance entries will automatically populate here when staff clock in via the Backoffice portal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Work Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRecords.map((rec, idx) => (
                  <tr key={rec._id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                      <div>{rec.staffName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{rec.employeeId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700 dark:text-slate-300">{rec.department}</div>
                      <div className="text-[10px] text-slate-400">{rec.role}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {rec.date ? new Date(rec.date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        rec.status === 'Present' || rec.checkIn
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : rec.status === 'Absent'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {rec.status || 'Present'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rec.workLocation || 'Headquarters'}</span>
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

