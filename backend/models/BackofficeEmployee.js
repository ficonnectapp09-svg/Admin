const mongoose = require('mongoose');

const BackofficeEmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  photo: { type: String, default: '' },
  department: {
    type: String,
    enum: ['Overall', 'KYC Team', 'Payment Team', 'Queries Team'],
    required: true,
    index: true
  },
  designation: { type: String, required: true, trim: true },
  role: {
    type: String,
    enum: [
      'overall_lead',
      'kyc_lead',
      'payment_lead',
      'queries_lead',
      'kyc_employee',
      'payment_employee',
      'queries_employee'
    ],
    required: true,
    index: true
  },
  reportingLead: { type: mongoose.Schema.Types.ObjectId, ref: 'backoffice_employees', default: null },
  joiningDate: { type: Date, default: Date.now },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract'], default: 'Full-time' },
  workLocation: { type: String, default: 'Headquarters' },
  address: { type: String, default: '' },
  emergencyContact: {
    name: { type: String, default: '' },
    relationship: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  bankDetails: {
    accountHolder: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    bankName: { type: String, default: '' }
  },
  salaryCycle: { type: String, enum: ['Weekly', 'Monthly', 'Custom'], default: 'Monthly' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active', index: true },
  permissions: [{ type: String }],
  lastLogin: { type: Date, default: null }
}, {
  timestamps: true,
  collection: 'backoffice_employees'
});

BackofficeEmployeeSchema.index({ department: 1, role: 1, status: 1 });

module.exports = mongoose.model('backoffice_employees', BackofficeEmployeeSchema);

