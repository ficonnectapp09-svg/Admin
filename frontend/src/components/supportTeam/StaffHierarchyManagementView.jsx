import React, { useState, useMemo } from 'react';
import {
  Users, UserCheck, ShieldCheck, Plus, Search, Filter, RefreshCw,
  Mail, Phone, Calendar, MapPin, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronRight, X, Briefcase, Award, Shield
} from 'lucide-react';

export const StaffHierarchyManagementView = ({
  hierarchyData,
  loading,
  onRefresh,
  API_BASE,
  token,
  onToast
}) => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Onboard modal state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardLevel, setOnboardLevel] = useState('LEAD'); // 'LEAD' | 'DEPT_LEAD' | 'EMPLOYEE'
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'KYC Team',
    designation: '',
    workLocation: 'Headquarters',
    salaryCycle: 'Monthly',
    password: ''
  });
  const [submittingOnboard, setSubmittingOnboard] = useState(false);

  // Status toggle modal
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const allStaff = hierarchyData?.allStaff || [];
  const level2 = hierarchyData?.level2 || null;
  const level3 = hierarchyData?.level3 || {};
  const level4 = hierarchyData?.level4 || {};

  const filteredStaff = useMemo(() => {
    return allStaff.filter(emp => {
      const matchSearch =
        !search ||
        emp.name?.toLowerCase().includes(search.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(search.toLowerCase());

      const matchDept = deptFilter === 'All' || emp.department === deptFilter;
      const matchStatus = statusFilter === 'All' || emp.status === statusFilter;
      const matchRole =
        roleFilter === 'All' ||
        (roleFilter === 'Leads' && emp.role.includes('lead')) ||
        (roleFilter === 'Employees' && emp.role.includes('employee'));

      return matchSearch && matchDept && matchStatus && matchRole;
    });
  }, [allStaff, search, deptFilter, roleFilter, statusFilter]);

  const handleStatusToggle = async (emp) => {
    const nextStatus = emp.status === 'active' ? 'inactive' : 'active';
    setUpdatingStatusId(emp.employeeId);
    try {
      const res = await fetch(`${API_BASE}/admin/support-team/staff/${emp.employeeId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (onToast) onToast(`Staff ${emp.name} marked as ${nextStatus}`, 'success');
        onRefresh();
      } else {
        if (onToast) onToast(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      if (onToast) onToast('Network error updating status', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setSubmittingOnboard(true);

    try {
      let endpoint = '/admin/support-team/onboard-lead';
      if (onboardLevel === 'DEPT_LEAD') {
        endpoint = '/admin/support-team/onboard-dept-lead';
      } else if (onboardLevel === 'EMPLOYEE') {
        endpoint = '/admin/support-team/onboard-employee';
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(onboardForm)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (onToast) onToast(data.message || 'Staff onboarded successfully!', 'success');
        setShowOnboardModal(false);
        setOnboardForm({
          name: '',
          email: '',
          phone: '',
          department: 'KYC Team',
          designation: '',
          workLocation: 'Headquarters',
          salaryCycle: 'Monthly',
          password: ''
        });
        onRefresh();
      } else {
        if (onToast) onToast(data.message || 'Failed to onboard staff', 'error');
      }
    } catch (err) {
      if (onToast) onToast('Network error during onboarding', 'error');
    } finally {
      setSubmittingOnboard(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Onboarding Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Staff Hierarchy & Onboarding Management
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Strict 4-Level Model
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Super Admin ➔ Support Team Lead ➔ Department Team Leads ➔ Department Employees.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setOnboardLevel('LEAD');
              setShowOnboardModal(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Shield className="w-4 h-4" />
            <span>Onboard Support Lead</span>
          </button>

          <button
            onClick={() => {
              setOnboardLevel('DEPT_LEAD');
              setShowOnboardModal(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            <span>Onboard Dept Lead</span>
          </button>

          <button
            onClick={() => {
              setOnboardLevel('EMPLOYEE');
              setShowOnboardModal(true);
            }}
            className="px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Employee</span>
          </button>
        </div>
      </div>

      {/* 4-Level Hierarchy Visual Tree */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 text-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Active Staff Hierarchy Tree
          </span>
          <span className="text-xs font-mono text-indigo-400">Source: backoffice_employees</span>
        </div>

        {/* Level 1: Super Admin */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-indigo-300">LEVEL 1</div>
              <div className="text-base font-extrabold text-white">Super Admin Governance</div>
              <div className="text-xs text-slate-400">Directly onboards and governs Support Team Lead</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Root Authority
          </span>
        </div>

        {/* Level 2: Support Team Lead */}
        <div className="pl-6 border-l-2 border-indigo-800/60 ml-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-600 text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-purple-300">LEVEL 2 • SUPPORT TEAM LEAD</div>
                <div className="text-base font-extrabold text-white">{level2?.name || 'Rajesh Sharma'}</div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-purple-300">{level2?.employeeId || 'EMP-LEAD-001'}</span>
                  <span>•</span>
                  <span>{level2?.email}</span>
                  <span>•</span>
                  <span>{level2?.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
                <div className="font-bold text-emerald-400 capitalize">{level2?.status || 'active'}</div>
              </div>
            </div>
          </div>

          {/* Level 3: Department Team Leads */}
          <div className="pl-6 border-l-2 border-purple-800/60 ml-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KYC Lead */}
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-300">LEVEL 3 • KYC LEAD</span>
                <span className="font-mono text-[10px] text-blue-400">{level3.kycLead?.employeeId || 'EMP-KYC-001'}</span>
              </div>
              <div className="font-bold text-white text-sm">{level3.kycLead?.name || 'Priya Sundaram'}</div>
              <div className="text-[11px] text-slate-400">{level3.kycLead?.phone}</div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-blue-900/60 flex justify-between">
                <span>KYC Employees:</span>
                <span className="font-bold text-white">{level4.kycEmployees?.length || 1}</span>
              </div>
            </div>

            {/* Payment Lead */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-300">LEVEL 3 • PAYMENT LEAD</span>
                <span className="font-mono text-[10px] text-emerald-400">{level3.paymentLead?.employeeId || 'EMP-PAY-001'}</span>
              </div>
              <div className="font-bold text-white text-sm">{level3.paymentLead?.name || 'Vikramaditya Verma'}</div>
              <div className="text-[11px] text-slate-400">{level3.paymentLead?.phone}</div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-emerald-900/60 flex justify-between">
                <span>Payment Specialists:</span>
                <span className="font-bold text-white">{level4.paymentEmployees?.length || 1}</span>
              </div>
            </div>

            {/* Queries Lead */}
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-purple-300">LEVEL 3 • QUERIES LEAD</span>
                <span className="font-mono text-[10px] text-purple-400">{level3.queriesLead?.employeeId || 'EMP-QRY-001'}</span>
              </div>
              <div className="font-bold text-white text-sm">{level3.queriesLead?.name || 'Ananya Deshmukh'}</div>
              <div className="text-[11px] text-slate-400">{level3.queriesLead?.phone}</div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-purple-900/60 flex justify-between">
                <span>Query Specialists:</span>
                <span className="font-bold text-white">{level4.queriesEmployees?.length || 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Directory Filters & Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search staff name, ID, email..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Dept Filter */}
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              <option value="All">All Departments</option>
              <option value="Overall">Overall</option>
              <option value="KYC Team">KYC Team</option>
              <option value="Payment Team">Payment Team</option>
              <option value="Queries Team">Queries Team</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              <option value="All">All Roles</option>
              <option value="Leads">Team Leads</option>
              <option value="Employees">Staff Employees</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Department & Role</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Workload (Assigned / Done / Pending)</th>
                <th className="py-3 px-3">Joining Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No staff records match the current filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-800 dark:text-slate-100">{emp.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{emp.employeeId}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.department === 'KYC Team' ? 'bg-blue-500/10 text-blue-600' :
                        emp.department === 'Payment Team' ? 'bg-emerald-500/10 text-emerald-600' :
                        emp.department === 'Queries Team' ? 'bg-purple-500/10 text-purple-600' :
                        'bg-indigo-500/10 text-indigo-600'
                      }`}>
                        {emp.department}
                      </span>
                      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">{emp.designation}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">{emp.phone}</div>
                      <div className="text-[11px] text-slate-400">{emp.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-slate-700 dark:text-slate-300 font-bold">{emp.assignedCount || 0} assigned</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold">{emp.completedCount || 0} done</span>
                        <span>•</span>
                        <span className="text-amber-500 font-bold">{emp.pendingCount || 0} pending</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleStatusToggle(emp)}
                        disabled={updatingStatusId === emp.employeeId}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                          emp.status === 'active'
                            ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600'
                            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                        }`}
                      >
                        {updatingStatusId === emp.employeeId
                          ? 'Updating...'
                          : emp.status === 'active'
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                  {onboardLevel === 'LEAD'
                    ? 'Onboard Support Team Lead (Level 2)'
                    : onboardLevel === 'DEPT_LEAD'
                    ? 'Onboard Department Team Lead (Level 3)'
                    : 'Onboard Department Employee (Level 4)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {onboardLevel === 'LEAD'
                    ? 'Super Admin creates overall Support Team Lead'
                    : onboardLevel === 'DEPT_LEAD'
                    ? 'Support Team Lead onboards Department Lead'
                    : 'Department Lead onboards staff specialist'}
                </p>
              </div>
              <button onClick={() => setShowOnboardModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={onboardForm.name}
                  onChange={e => setOnboardForm({ ...onboardForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={onboardForm.email}
                    onChange={e => setOnboardForm({ ...onboardForm, email: e.target.value })}
                    placeholder="name@connectapp.in"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={onboardForm.phone}
                    onChange={e => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              {onboardLevel !== 'LEAD' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Department</label>
                  <select
                    value={onboardForm.department}
                    onChange={e => setOnboardForm({ ...onboardForm, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold"
                  >
                    <option value="KYC Team">KYC Team</option>
                    <option value="Payment Team">Payment Team</option>
                    <option value="Queries Team">Queries Team</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.designation}
                    onChange={e => setOnboardForm({ ...onboardForm, designation: e.target.value })}
                    placeholder={onboardLevel === 'LEAD' ? 'Support Team Lead' : onboardLevel === 'DEPT_LEAD' ? 'Department Lead' : 'Senior Analyst'}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={onboardForm.workLocation}
                    onChange={e => setOnboardForm({ ...onboardForm, workLocation: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Initial Password</label>
                <input
                  type="text"
                  value={onboardForm.password}
                  onChange={e => setOnboardForm({ ...onboardForm, password: e.target.value })}
                  placeholder="Leave blank for default: Connect@2026"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={submittingOnboard}
                  className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {submittingOnboard ? 'Onboarding...' : 'Confirm Staff Onboarding'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

