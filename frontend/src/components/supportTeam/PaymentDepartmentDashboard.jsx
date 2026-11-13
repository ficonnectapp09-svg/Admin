import React, { useState, useEffect } from 'react';
import {
  DollarSign, RefreshCw, Search, ShieldCheck, CheckCircle2, XCircle, Clock,
  ArrowRight, FileText, Layers, AlertCircle, TrendingUp
} from 'lucide-react';

export const PaymentDepartmentDashboard = ({ API_BASE, token, onToast }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'INCOME' | 'EXPENSE' | 'LIABILITY' | 'MAKER_CHECKER'
  const [search, setSearch] = useState('');

  const fetchPaymentStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/support-team/payment/stats`, {
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
      if (onToast) onToast('Failed to load Payment statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentStats();
  }, []);

  const totals = data?.totals || {};
  const makerChecker = data?.makerChecker || {};
  const recentTransactions = data?.recentTransactions || [];
  const recentApprovals = makerChecker.recentApprovals || [];

  const filteredTxns = recentTransactions.filter(t => {
    const matchClass =
      activeTab === 'ALL' ||
      (activeTab === 'INCOME' && t.financialClassification === 'Income') ||
      (activeTab === 'EXPENSE' && t.financialClassification === 'Outgoing') ||
      (activeTab === 'LIABILITY' && t.financialClassification === 'Liability');

    const matchSearch =
      !search ||
      t.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
      t.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
      t.sourceOrPurpose?.toLowerCase().includes(search.toLowerCase());

    return matchClass && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Payment Team Department Dashboard
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Department Operations
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Monitoring financial ledger integrity, Maker-Checker authorizations, and strict liability separation.
          </p>
        </div>

        <button
          onClick={fetchPaymentStats}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Payment Ledger</span>
        </button>
      </div>

      {/* 4 Strictly Isolated Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income */}
        <div className="p-5 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
            Recognized Income (Revenue)
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ₹{Number(totals.recognizedIncomeTotal || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Orders, Subscriptions, Memberships, Fees
          </span>
        </div>

        {/* Expenses */}
        <div className="p-5 rounded-3xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">
            Qualifying Expenses (Payouts)
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ₹{Number(totals.qualifyingExpensesTotal || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Vendor settlements, Commissions, Delivery fees
          </span>
        </div>

        {/* Agent Deposit Liability */}
        <div className="p-5 rounded-3xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">
            Agent Deposit Liabilities
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ₹{Number(totals.agentDepositLiabilitiesTotal || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">
            Strictly Isolated Balance-Sheet Deposit
          </span>
        </div>

        {/* Maker-Checker Approvals */}
        <div className="p-5 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
            Maker-Checker In-Review
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {makerChecker.pendingCount || 0} Pending
          </div>
          <span className="text-[10px] text-slate-500 block">
            Dual-Control Authorization Required
          </span>
        </div>
      </div>

      {/* Maker-Checker Approval Status Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Maker-Checker Dual-Control Approvals
            </h3>
            <p className="text-xs text-slate-500">
              Ensuring independent authorization: Maker creates payout ➔ Checker (Payment Lead) authorizes.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600">
            {recentApprovals.length} Approval Requests Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Approval ID & Purpose</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Maker (Creator)</th>
                <th className="py-3 px-3">Checker (Authorizer)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentApprovals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No maker-checker approval requests currently pending review.
                  </td>
                </tr>
              ) : (
                recentApprovals.map(apr => (
                  <tr key={apr.approvalId || apr._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-800 dark:text-white">{apr.sourceOrPurpose || apr.purpose}</div>
                      <div className="font-mono text-[10px] text-slate-400">{apr.approvalId}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₹{Number(apr.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{apr.makerName || apr.createdByUserName || 'Payment Maker'}</div>
                      <div className="font-mono text-[10px] text-slate-400">{apr.makerId || 'EMP-PAY-002'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{apr.checkerName || 'Vikramaditya Verma'}</div>
                      <div className="font-mono text-[10px] text-slate-400">{apr.checkerId || 'Pending'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        apr.status === 'Approved' || apr.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' :
                        apr.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {apr.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                      {apr.createdAt ? new Date(apr.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Classification Filter Bar & Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            {[
              { key: 'ALL', label: 'All Transactions' },
              { key: 'INCOME', label: 'Income Only' },
              { key: 'EXPENSE', label: 'Expenses Only' },
              { key: 'LIABILITY', label: 'Agent Deposit Liabilities' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search txn ID or purpose..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Transaction ID</th>
                <th className="py-3 px-3">Classification</th>
                <th className="py-3 px-3">Purpose / Party</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No transactions match the selected classification.
                  </td>
                </tr>
              ) : (
                filteredTxns.map(t => (
                  <tr key={t.transactionId || t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {t.transactionId}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.financialClassification === 'Income' ? 'bg-emerald-500/10 text-emerald-600' :
                        t.financialClassification === 'Outgoing' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-purple-500/10 text-purple-600'
                      }`}>
                        {t.financialClassification === 'Outgoing' ? 'Expense' : t.financialClassification}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{t.sourceOrPurpose || t.purpose}</div>
                      <div className="text-[11px] text-slate-400">{t.recipientName || t.senderName}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      ₹{Number(t.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
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

