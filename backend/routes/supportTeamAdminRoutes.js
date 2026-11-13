const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const BackofficeEmployee = require('../models/BackofficeEmployee');

// Helper to get raw mongo db instance
const getDb = () => mongoose.connection.db;

// Helper: Audit Logger
const logSupportAudit = async (req, action, targetId, details) => {
  try {
    const db = getDb();
    await db.collection('backoffice_audit_trails').insertOne({
      action,
      module: 'SUPPORT_TEAM',
      targetId: String(targetId),
      actorId: req.user?.id || req.user?._id || 'SUPER_ADMIN',
      actorName: req.user?.name || 'Super Admin',
      actorRole: req.user?.role || 'super-admin',
      department: 'Super Admin',
      details,
      timestamp: new Date(),
      createdAt: new Date()
    });
  } catch (err) {
    console.warn('Failed to log audit:', err.message);
  }
};

// ==============================================================================
// 1. GET /overview - Centralized Dashboard Metrics (100% Database-Driven)
// ==============================================================================
router.get('/overview', async (req, res) => {
  try {
    const db = getDb();

    // 1. Staff Summary
    const employees = await BackofficeEmployee.find({}).lean();
    const totalStaff = employees.length;
    const supportLead = employees.find(e => e.role === 'overall_lead') || null;
    const deptLeads = employees.filter(e => ['kyc_lead', 'payment_lead', 'queries_lead'].includes(e.role));
    const deptEmployees = employees.filter(e => ['kyc_employee', 'payment_employee', 'queries_employee'].includes(e.role));
    const activeStaff = employees.filter(e => e.status === 'active').length;
    const inactiveStaff = employees.filter(e => e.status !== 'active').length;

    // 2. Attendance Summary Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendanceRecords = await db.collection('backoffice_attendance_records').find({}).toArray();
    const presentToday = attendanceRecords.filter(a => a.status === 'Present' || a.checkInTime).length;
    const absentToday = attendanceRecords.filter(a => a.status === 'Absent').length;

    // 3. KYC Summary
    const kycDocs = await db.collection('backoffice_kyc_requests').find({}).toArray();
    const kycSummary = {
      received: kycDocs.length,
      unassigned: kycDocs.filter(k => k.status === 'Unassigned').length,
      assigned: kycDocs.filter(k => k.status === 'Assigned').length,
      inProgress: kycDocs.filter(k => k.status === 'In Progress').length,
      pending: kycDocs.filter(k => ['Unassigned', 'Assigned', 'In Progress', 'Re-upload Requested'].includes(k.status)).length,
      approved: kycDocs.filter(k => k.status === 'Approved').length,
      rejected: kycDocs.filter(k => k.status === 'Rejected').length,
      reupload: kycDocs.filter(k => k.status === 'Re-upload Requested').length,
      completed: kycDocs.filter(k => ['Approved', 'Rejected'].includes(k.status)).length
    };

    // 4. Payment Operations Summary (Strict Isolation: Income vs Expenses vs Liabilities)
    const payTxns = await db.collection('backoffice_payment_transactions').find({}).toArray();
    const depositLiabilities = await db.collection('backoffice_agent_deposit_liabilities').find({}).toArray();
    const financialApprovals = await db.collection('backoffice_financial_approvals').find({}).toArray();

    let recognizedIncomeTotal = 0;
    let qualifyingExpensesTotal = 0;
    let agentDepositLiabilitiesTotal = 0;

    payTxns.forEach(item => {
      const amt = Number(item.amount) || Number(item.finalAmount) || 0;
      if (item.financialClassification === 'Income') recognizedIncomeTotal += amt;
      else if (item.financialClassification === 'Expense' || item.financialClassification === 'Outgoing') qualifyingExpensesTotal += amt;
    });

    depositLiabilities.forEach(dep => {
      agentDepositLiabilitiesTotal += Number(dep.depositAmount) || Number(dep.currentOutstandingBalance) || 0;
    });

    const paymentSummary = {
      totalTransactions: payTxns.length,
      recognizedIncomeTotal,
      qualifyingExpensesTotal,
      agentDepositLiabilitiesTotal,
      pendingCheckerApprovals: financialApprovals.filter(a => ['PENDING_CHECKER', 'Pending Checker Review', 'Pending', 'SUBMITTED'].includes(a.status)).length,
      completedApprovals: financialApprovals.filter(a => ['APPROVED', 'Completed', 'Approved'].includes(a.status)).length,
      rejectedApprovals: financialApprovals.filter(a => ['REJECTED', 'Rejected'].includes(a.status)).length
    };

    // 5. Queries Operations Summary
    const queries = await db.collection('backoffice_query_tickets').find({}).toArray();
    const queriesSummary = {
      received: queries.length,
      unassigned: queries.filter(q => q.status === 'New' || q.status === 'Unassigned' || !q.assignedEmployeeId).length,
      assigned: queries.filter(q => q.status === 'Assigned' || (q.assignedEmployeeId && q.status !== 'Resolved' && q.status !== 'Closed')).length,
      inProgress: queries.filter(q => q.status === 'In Progress').length,
      pending: queries.filter(q => ['New', 'Assigned', 'In Progress', 'Transferred to Payment', 'Transferred to KYC', 'Waiting for Response'].includes(q.status)).length,
      resolved: queries.filter(q => q.status === 'Resolved').length,
      closed: queries.filter(q => q.status === 'Closed').length,
      transferred: queries.filter(q => (q.transferHistory && q.transferHistory.length > 0) || q.status?.includes('Transferred')).length,
      overdue: queries.filter(q => q.status === 'Overdue' || q.priority === 'High' || q.slaBreached).length
    };

    return res.json({
      success: true,
      data: {
        staff: {
          totalStaff,
          supportLead,
          totalDeptLeads: deptLeads.length,
          totalEmployees: deptEmployees.length,
          activeStaff,
          inactiveStaff,
          attendance: {
            presentToday,
            absentToday,
            totalLogs: attendanceRecords.length
          }
        },
        departments: {
          kyc: kycSummary,
          payment: paymentSummary,
          queries: queriesSummary
        }
      }
    });
  } catch (err) {
    console.error('Support Team Overview Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================================================================
// 2. GET /hierarchy - Full 4-Level Strict Staff Hierarchy
// ==============================================================================
router.get('/hierarchy', async (req, res) => {
  try {
    const db = getDb();
    const employees = await BackofficeEmployee.find({}).sort({ createdAt: 1 }).lean();

    const overallLead = employees.find(e => e.role === 'overall_lead') || null;
    const kycLead = employees.find(e => e.role === 'kyc_lead') || null;
    const paymentLead = employees.find(e => e.role === 'payment_lead') || null;
    const queriesLead = employees.find(e => e.role === 'queries_lead') || null;

    const kycEmployees = employees.filter(e => e.role === 'kyc_employee');
    const paymentEmployees = employees.filter(e => e.role === 'payment_employee');
    const queriesEmployees = employees.filter(e => e.role === 'queries_employee');

    // Attach real workload stats per employee
    const kycRequests = await db.collection('backoffice_kyc_requests').find({}).toArray();
    const queries = await db.collection('backoffice_query_tickets').find({}).toArray();
    const payTxns = await db.collection('backoffice_payment_transactions').find({}).toArray();

    const enrichEmployee = (emp) => {
      let assignedCount = 0;
      let completedCount = 0;
      let pendingCount = 0;

      if (emp.department === 'KYC Team') {
        const myKyc = kycRequests.filter(k => k.assignedEmployeeId === emp.employeeId);
        assignedCount = myKyc.length;
        completedCount = myKyc.filter(k => ['Approved', 'Rejected'].includes(k.status)).length;
        pendingCount = assignedCount - completedCount;
      } else if (emp.department === 'Payment Team') {
        const myPayments = payTxns.filter(l => l.handledByEmployeeId === emp.employeeId || l.makerId === emp.employeeId || l.createdByUserId === emp.employeeId);
        assignedCount = myPayments.length;
        completedCount = myPayments.filter(l => l.status === 'COMPLETED' || l.status === 'Completed').length;
        pendingCount = assignedCount - completedCount;
      } else if (emp.department === 'Queries Team') {
        const myQueries = queries.filter(q => q.assignedEmployeeId === emp.employeeId);
        assignedCount = myQueries.length;
        completedCount = myQueries.filter(q => ['Resolved', 'Closed'].includes(q.status)).length;
        pendingCount = assignedCount - completedCount;
      }

      return {
        ...emp,
        assignedCount,
        completedCount,
        pendingCount
      };
    };

    const tree = {
      level1: {
        role: 'SUPER_ADMIN',
        title: 'Super Admin',
        description: 'Authorized Access to All Departments & Onboards Support Team Lead'
      },
      level2: overallLead ? enrichEmployee(overallLead) : null,
      level3: {
        kycLead: kycLead ? enrichEmployee(kycLead) : null,
        paymentLead: paymentLead ? enrichEmployee(paymentLead) : null,
        queriesLead: queriesLead ? enrichEmployee(queriesLead) : null
      },
      level4: {
        kycEmployees: kycEmployees.map(enrichEmployee),
        paymentEmployees: paymentEmployees.map(enrichEmployee),
        queriesEmployees: queriesEmployees.map(enrichEmployee)
      }
    };

    return res.json({
      success: true,
      data: {
        totalStaff: employees.length,
        tree,
        flatStaff: employees.map(enrichEmployee)
      }
    });
  } catch (err) {
    console.error('Support Team Hierarchy Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================================================================
// 3. POST /onboard-lead - Super Admin onboards Support Team Lead (Level 2)
// ==============================================================================
router.post('/onboard-lead', async (req, res) => {
  try {
    const { name, email, phone, designation, password, workLocation, salaryCycle } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are mandatory.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await BackofficeEmployee.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Staff with this email already exists.' });
    }

    const existingLead = await BackofficeEmployee.findOne({ role: 'overall_lead' });
    if (existingLead) {
      return res.status(400).json({ success: false, message: 'Support Team Lead is already onboarded. Only one Lead can head the Support Team.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'Connect@2026', salt);

    const newLead = new BackofficeEmployee({
      employeeId: 'EMP-LEAD-001',
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      department: 'Overall',
      designation: designation || 'Support Team Lead',
      role: 'overall_lead',
      reportingLead: null,
      workLocation: workLocation || 'Headquarters',
      salaryCycle: salaryCycle || 'Monthly',
      status: 'active',
      permissions: ['MANAGE_SUPPORT_TEAM', 'ONBOARD_DEPT_LEADS', 'VIEW_ALL_DEPARTMENTS', 'GENERATE_AUDIT_REPORTS']
    });

    await newLead.save();
    await logSupportAudit(req, 'ONBOARD_SUPPORT_LEAD', newLead.employeeId, `Onboarded Support Team Lead ${name}`);

    return res.status(201).json({
      success: true,
      message: 'Support Team Lead onboarded successfully.',
      data: newLead
    });
  } catch (err) {
    console.error('Onboard Support Lead Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================================================================
// 4. POST /onboard-dept-lead - Support Team Lead onboards Department Team Lead (Level 3)
// ==============================================================================
router.post('/onboard-dept-lead', async (req, res) => {
  try {
    const { name, email, phone, department, designation, password, workLocation, salaryCycle } = req.body;

    if (!name || !email || !phone || !department) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, and department are mandatory.' });
    }

    if (!['KYC Team', 'Payment Team', 'Queries Team'].includes(department)) {
      return res.status(400).json({ success: false, message: 'Invalid department. Must be KYC Team, Payment Team, or Queries Team.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await BackofficeEmployee.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Staff with this email already exists.' });
    }

    // Role mapping
    let leadRole = 'kyc_lead';
    let prefix = 'KYC';
    if (department === 'Payment Team') {
      leadRole = 'payment_lead';
      prefix = 'PAY';
    } else if (department === 'Queries Team') {
      leadRole = 'queries_lead';
      prefix = 'QRY';
    }

    const existingLead = await BackofficeEmployee.findOne({ role: leadRole });
    if (existingLead) {
      return res.status(400).json({ success: false, message: `${department} Lead is already onboarded.` });
    }

    // Find Support Team Lead as reporting manager
    const supportLead = await BackofficeEmployee.findOne({ role: 'overall_lead' });
    if (!supportLead) {
      return res.status(400).json({ success: false, message: 'Cannot onboard Department Lead: Support Team Lead must be onboarded first.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'Connect@2026', salt);

    const newDeptLead = new BackofficeEmployee({
      employeeId: `EMP-${prefix}-001`,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      department,
      designation: designation || `${department} Lead`,
      role: leadRole,
      reportingLead: supportLead._id,
      workLocation: workLocation || 'Headquarters',
      salaryCycle: salaryCycle || 'Monthly',
      status: 'active',
      permissions: [`MANAGE_${prefix}_TEAM`, 'ASSIGN_TASKS', 'VIEW_DEPARTMENT_REPORTS']
    });

    await newDeptLead.save();
    await logSupportAudit(req, 'ONBOARD_DEPT_LEAD', newDeptLead.employeeId, `Onboarded ${department} Lead ${name}`);

    return res.status(201).json({
      success: true,
      message: `${department} Lead onboarded successfully.`,
      data: newDeptLead
    });
  } catch (err) {
    console.error('Onboard Dept Lead Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================================================================
// 5. POST /onboard-employee - Department Lead onboards Department Employee (Level 4)
// ==============================================================================
router.post('/onboard-employee', async (req, res) => {
  try {
    const { name, email, phone, department, designation, password, workLocation, salaryCycle } = req.body;

    if (!name || !email || !phone || !department) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, and department are mandatory.' });
    }

    if (!['KYC Team', 'Payment Team', 'Queries Team'].includes(department)) {
      return res.status(400).json({ success: false, message: 'Invalid department specified.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await BackofficeEmployee.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Staff with this email already exists.' });
    }

    // Resolve Department Lead as parent
    let leadRole = 'kyc_lead';
    let empRole = 'kyc_employee';
    let prefix = 'KYC';

    if (department === 'Payment Team') {
      leadRole = 'payment_lead';
      empRole = 'payment_employee';
      prefix = 'PAY';
    } else if (department === 'Queries Team') {
      leadRole = 'queries_lead';
      empRole = 'queries_employee';
      prefix = 'QRY';
    }

    const deptLead = await BackofficeEmployee.findOne({ role: leadRole });
    if (!deptLead) {
      return res.status(400).json({ success: false, message: `Cannot onboard employee: ${department} Lead must be onboarded first.` });
    }

    const count = await BackofficeEmployee.countDocuments({ department, role: empRole });
    const employeeId = `EMP-${prefix}-${String(count + 2).padStart(3, '0')}`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'Connect@2026', salt);

    const newEmp = new BackofficeEmployee({
      employeeId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      department,
      designation: designation || `${department} Specialist`,
      role: empRole,
      reportingLead: deptLead._id,
      workLocation: workLocation || 'Headquarters',
      salaryCycle: salaryCycle || 'Monthly',
      status: 'active',
      permissions: [`EXECUTE_${prefix}_TASKS`]
    });

    await newEmp.save();
    await logSupportAudit(req, 'ONBOARD_EMPLOYEE', employeeId, `Onboarded ${department} Employee ${name}`);

    return res.status(201).json({
      success: true,
      message: `${department} Employee onboarded successfully.`,
      data: newEmp
    });
  } catch (err) {
    console.error('Onboard Employee Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================================================================
// 6. PUT /staff/:id/status - Activate / Deactivate Staff Member
// ==============================================================================
router.put('/staff/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const emp = await BackofficeEmployee.findOne({
      $or: [{ employeeId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    });

    if (!emp) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    emp.status = status;
    await emp.save();

    await logSupportAudit(req, 'STAFF_STATUS_UPDATE', emp.employeeId, `Status updated to ${status}`);

    return res.json({
      success: true,
      message: `Staff member ${emp.name} is now ${status}.`,
      data: emp
    });
  } catch (err) {
    console.error('Update Staff Status Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================================================================
// 7. GET /kyc/stats - KYC Operations Deep-Dive Across 10 Categories
// ==============================================================================
router.get('/kyc/stats', async (req, res) => {
  try {
    const db = getDb();
    const requests = await db.collection('backoffice_kyc_requests').find({}).sort({ submissionDate: -1 }).toArray();

    // Grouping by category
    const categories = [
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

    const categoryStats = {};
    categories.forEach(cat => {
      const catRequests = requests.filter(r => r.applicantCategory === cat || r.role === cat);
      categoryStats[cat] = {
        total: catRequests.length,
        approved: catRequests.filter(r => r.status === 'Approved').length,
        rejected: catRequests.filter(r => r.status === 'Rejected').length,
        pending: catRequests.filter(r => ['Unassigned', 'Assigned', 'In Progress'].includes(r.status)).length,
        reupload: catRequests.filter(r => r.status === 'Re-upload Requested').length
      };
    });

    const statusCounts = {
      unassigned: requests.filter(r => r.status === 'Unassigned').length,
      assigned: requests.filter(r => r.status === 'Assigned').length,
      inProgress: requests.filter(r => r.status === 'In Progress').length,
      approved: requests.filter(r => r.status === 'Approved').length,
      rejected: requests.filter(r => r.status === 'Rejected').length,
      reupload: requests.filter(r => r.status === 'Re-upload Requested').length
    };

    return res.json({
      success: true,
      data: {
        totalRequests: requests.length,
        statusCounts,
        categoryStats,
        recentRequests: requests.slice(0, 50)
      }
    });
  } catch (err) {
    console.error('KYC Stats Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================================================================
// 8. GET /payment/stats - Payment Operations Deep-Dive (Income, Expenses, Liabilities)
// ==============================================================================
router.get('/payment/stats', async (req, res) => {
  try {
    const db = getDb();
    const payTxns = await db.collection('backoffice_payment_transactions').find({}).sort({ transactionDate: -1, createdAt: -1 }).toArray();
    const depositLiabilities = await db.collection('backoffice_agent_deposit_liabilities').find({}).sort({ depositDate: -1, createdAt: -1 }).toArray();
    const approvals = await db.collection('backoffice_financial_approvals').find({}).sort({ createdAt: -1 }).toArray();

    let recognizedIncomeTotal = 0;
    let qualifyingExpensesTotal = 0;
    let agentDepositLiabilitiesTotal = 0;

    const incomeTxns = [];
    const expenseTxns = [];
    const liabilityTxns = [];

    payTxns.forEach(item => {
      const amt = Number(item.amount) || Number(item.finalAmount) || 0;
      if (item.financialClassification === 'Income') {
        recognizedIncomeTotal += amt;
        incomeTxns.push(item);
      } else if (item.financialClassification === 'Expense' || item.financialClassification === 'Outgoing') {
        qualifyingExpensesTotal += amt;
        expenseTxns.push(item);
      }
    });

    depositLiabilities.forEach(item => {
      const amt = Number(item.depositAmount) || Number(item.currentOutstandingBalance) || 0;
      agentDepositLiabilitiesTotal += amt;
      liabilityTxns.push({
        ...item,
        transactionId: item.liabilityId || item.originalTransactionId,
        party: item.agentName,
        amount: amt,
        financialClassification: 'Liability',
        notes: item.notes || 'Agent franchise deposit liability'
      });
    });

    const makerChecker = {
      pending: approvals.filter(a => ['PENDING_CHECKER', 'Pending Checker Review', 'Pending', 'SUBMITTED'].includes(a.status)),
      approved: approvals.filter(a => ['APPROVED', 'Approved', 'Completed'].includes(a.status)),
      rejected: approvals.filter(a => ['REJECTED', 'Rejected'].includes(a.status))
    };

    return res.json({
      success: true,
      data: {
        totals: {
          income: recognizedIncomeTotal,
          expenses: qualifyingExpensesTotal,
          liabilities: agentDepositLiabilitiesTotal,
          netOperationalCashFlow: recognizedIncomeTotal - qualifyingExpensesTotal
        },
        counts: {
          totalTxns: payTxns.length + depositLiabilities.length,
          incomeTxnsCount: incomeTxns.length,
          expenseTxnsCount: expenseTxns.length,
          liabilityTxnsCount: liabilityTxns.length,
          pendingApprovals: makerChecker.pending.length
        },
        makerChecker,
        recentLedger: payTxns.slice(0, 50),
        liabilities: depositLiabilities
      }
    });
  } catch (err) {
    console.error('Payment Stats Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================================================================
// 9. GET /queries/stats - Queries Operations Deep-Dive (8 Categories)
// ==============================================================================
router.get('/queries/stats', async (req, res) => {
  try {
    const db = getDb();
    const queries = await db.collection('backoffice_query_tickets').find({}).sort({ createdAt: -1 }).toArray();

    const categories = [
      'Customer',
      'Vendor',
      'Agent',
      'Manager',
      'Sub Admin',
      'Delivery Partner',
      'Technician',
      'Internal'
    ];

    const categoryStats = {};
    categories.forEach(cat => {
      const catQueries = queries.filter(q => q.userType === cat || q.category?.includes(cat) || (cat === 'Internal' && q.isInternal));
      categoryStats[cat] = {
        total: catQueries.length,
        pending: catQueries.filter(q => ['New', 'Assigned', 'In Progress', 'Waiting for Response', 'Transferred to Payment', 'Transferred to KYC'].includes(q.status)).length,
        resolved: catQueries.filter(q => ['Resolved', 'Closed'].includes(q.status)).length
      };
    });

    const statusCounts = {
      new: queries.filter(q => q.status === 'New').length,
      assigned: queries.filter(q => q.status === 'Assigned').length,
      inProgress: queries.filter(q => q.status === 'In Progress').length,
      waiting: queries.filter(q => q.status === 'Waiting for Response').length,
      transferred: queries.filter(q => (q.transferHistory && q.transferHistory.length > 0) || q.status?.includes('Transferred')).length,
      resolved: queries.filter(q => q.status === 'Resolved').length,
      closed: queries.filter(q => q.status === 'Closed').length,
      overdue: queries.filter(q => q.status === 'Overdue' || q.priority === 'High' || q.slaBreached).length
    };

    return res.json({
      success: true,
      data: {
        totalQueries: queries.length,
        statusCounts,
        categoryStats,
        recentQueries: queries.slice(0, 50)
      }
    });
  } catch (err) {
    console.error('Queries Stats Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================================================================
// 10. GET /activities - Live Activity & Audit Stream
// ==============================================================================
router.get('/activities', async (req, res) => {
  try {
    const db = getDb();
    const { department, limit = 50 } = req.query;

    const query = {};
    if (department && department !== 'All') {
      query.$or = [{ department: department }, { 'details.department': department }, { module: department }];
    }

    const activities = await db.collection('backoffice_audit_trails')
      .find(query)
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(Number(limit))
      .toArray();

    return res.json({
      success: true,
      data: activities
    });
  } catch (err) {
    console.error('Activities Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================================================================
// 11. GET /attendance - Real Attendance Records
// ==============================================================================
router.get('/attendance', async (req, res) => {
  try {
    const db = getDb();
    const { department, startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.date.$lte = e;
      }
    }

    const attendanceRecords = await db.collection('backoffice_attendance_records')
      .find(filter)
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    const employees = await BackofficeEmployee.find({}).lean();
    const staffMap = new Map(employees.map(e => [e.employeeId, e]));

    const enriched = attendanceRecords.map(a => {
      const staff = staffMap.get(a.employeeId);
      return {
        ...a,
        staffName: a.employeeName || (staff ? staff.name : 'Unknown Staff'),
        department: a.department || (staff ? staff.department : 'General'),
        role: staff ? staff.role : 'Staff',
        checkIn: a.checkInTime || a.checkIn,
        checkOut: a.checkOutTime || a.checkOut
      };
    });

    const filtered = department && department !== 'All'
      ? enriched.filter(a => a.department === department)
      : enriched;

    return res.json({
      success: true,
      data: {
        totalRecords: filtered.length,
        present: filtered.filter(f => f.status === 'Present' || f.checkIn).length,
        absent: filtered.filter(f => f.status === 'Absent').length,
        leave: filtered.filter(f => f.status === 'Leave').length,
        records: filtered
      }
    });
  } catch (err) {
    console.error('Attendance Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================================================================
// 12. GET /performance - Objective Staff Performance
// ==============================================================================
router.get('/performance', async (req, res) => {
  try {
    const db = getDb();
    const employees = await BackofficeEmployee.find({}).lean();

    const kycRequests = await db.collection('backoffice_kyc_requests').find({}).toArray();
    const queries = await db.collection('backoffice_query_tickets').find({}).toArray();
    const payTxns = await db.collection('backoffice_payment_transactions').find({}).toArray();

    const staffPerformance = employees.map(emp => {
      let assigned = 0;
      let completed = 0;
      let pending = 0;
      let approved = 0;
      let rejected = 0;
      let reuploads = 0;

      if (emp.department === 'KYC Team') {
        const docs = kycRequests.filter(k => k.assignedEmployeeId === emp.employeeId);
        assigned = docs.length;
        approved = docs.filter(k => k.status === 'Approved').length;
        rejected = docs.filter(k => k.status === 'Rejected').length;
        reuploads = docs.filter(k => k.status === 'Re-upload Requested').length;
        completed = approved + rejected;
        pending = assigned - completed;
      } else if (emp.department === 'Payment Team') {
        const txns = payTxns.filter(l => l.handledByEmployeeId === emp.employeeId || l.makerId === emp.employeeId || l.createdByUserId === emp.employeeId);
        assigned = txns.length;
        completed = txns.filter(l => l.status === 'COMPLETED' || l.status === 'Completed').length;
        pending = assigned - completed;
      } else if (emp.department === 'Queries Team') {
        const qs = queries.filter(q => q.assignedEmployeeId === emp.employeeId);
        assigned = qs.length;
        completed = qs.filter(q => ['Resolved', 'Closed'].includes(q.status)).length;
        pending = assigned - completed;
      }

      const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

      return {
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        role: emp.role,
        assigned,
        completed,
        pending,
        approved,
        rejected,
        reuploads,
        completionRate,
        status: emp.status,
        lastLogin: emp.lastLogin
      };
    });

    return res.json({
      success: true,
      data: staffPerformance
    });
  } catch (err) {
    console.error('Performance Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================================================================
// 13. GET /reports - Daily and Monthly Aggregate Reports
// ==============================================================================
router.get('/reports', async (req, res) => {
  try {
    const db = getDb();
    const { range = 'this_month', customStart, customEnd } = req.query;

    let startDate = new Date();
    let endDate = new Date();

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'yesterday') {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'this_week') {
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'this_month') {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    } else if (range === 'previous_month') {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (range === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
    }

    const dateFilter = { $gte: startDate, $lte: endDate };

    const [kycPeriod, payPeriod, depPeriod, queriesPeriod, staffCount] = await Promise.all([
      db.collection('backoffice_kyc_requests').find({
        $or: [{ submissionDate: dateFilter }, { createdAt: dateFilter }]
      }).toArray(),
      db.collection('backoffice_payment_transactions').find({
        $or: [{ transactionDate: dateFilter }, { createdAt: dateFilter }]
      }).toArray(),
      db.collection('backoffice_agent_deposit_liabilities').find({
        $or: [{ depositDate: dateFilter }, { createdAt: dateFilter }]
      }).toArray(),
      db.collection('backoffice_query_tickets').find({
        $or: [{ createdAt: dateFilter }, { lastUpdated: dateFilter }]
      }).toArray(),
      BackofficeEmployee.countDocuments({ status: 'active' })
    ]);

    let incomeSum = 0;
    let expenseSum = 0;
    payPeriod.forEach(p => {
      const amt = Number(p.amount) || Number(p.finalAmount) || 0;
      if (p.financialClassification === 'Income') incomeSum += amt;
      else if (p.financialClassification === 'Expense' || p.financialClassification === 'Outgoing') expenseSum += amt;
    });

    let depositSum = 0;
    depPeriod.forEach(d => {
      depositSum += Number(d.depositAmount) || Number(d.currentOutstandingBalance) || 0;
    });

    return res.json({
      success: true,
      data: {
        range,
        startDate,
        endDate,
        staffCount,
        kyc: {
          totalRequests: kycPeriod.length,
          approved: kycPeriod.filter(k => k.status === 'Approved').length,
          rejected: kycPeriod.filter(k => k.status === 'Rejected').length,
          pending: kycPeriod.filter(k => ['Unassigned', 'Assigned', 'In Progress'].includes(k.status)).length,
          reuploads: kycPeriod.filter(k => k.status === 'Re-upload Requested').length
        },
        ledger: {
          totalTxns: payPeriod.length + depPeriod.length,
          totalIncome: incomeSum,
          totalExpenses: expenseSum,
          agentDepositLiabilities: depositSum,
          netRevenue: incomeSum - expenseSum
        },
        queries: {
          totalTickets: queriesPeriod.length,
          resolved: queriesPeriod.filter(q => ['Resolved', 'Closed'].includes(q.status)).length,
          open: queriesPeriod.filter(q => q.status === 'New' || q.status === 'Open').length,
          inProgress: queriesPeriod.filter(q => q.status === 'In Progress' || q.status === 'Assigned').length,
          escalated: queriesPeriod.filter(q => q.status?.includes('Transferred') || q.priority === 'High').length,
          slaBreached: queriesPeriod.filter(q => q.status === 'Overdue' || q.slaBreached).length
        }
      }
    });
  } catch (err) {
    console.error('Reports Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
