const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  location: {
    city: String,
    state: String,
    country: String,
    remote: {
      type: Boolean,
      default: false
    },
    remoteType: {
      type: String,
      enum: ['remote', 'hybrid', 'on-site'],
      default: 'on-site'
    }
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    skills: [String],
    experience: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['months', 'years'],
        default: 'years'
      }
    },
    education: {
      level: {
        type: String,
        enum: ['high-school', 'bachelor', 'master', 'phd', 'any']
      },
      field: [String]
    },
    certifications: [String]
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    },
    negotiable: {
      type: Boolean,
      default: false
    }
  },
  benefits: [String],
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  department: String,
  level: {
    type: String,
    enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
    default: 'mid'
  },
  applicationDeadline: Date,
  startDate: Date,
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'draft'],
    default: 'active'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  tags: [String],
  contactInfo: {
    email: String,
    phone: String,
    website: String
  },
  applicationInstructions: String,
  questions: [{
    question: String,
    required: Boolean,
    type: {
      type: String,
      enum: ['text', 'textarea', 'file', 'multiple-choice'],
      default: 'text'
    },
    options: [String] // for multiple choice questions
  }],
  keywords: [String], // for search optimization
  approved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true
});

// Index for search optimization
jobSchema.index({
  title: 'text',
  description: 'text',
  'companyName': 'text',
  'location.city': 'text',
  'location.state': 'text',
  'location.country': 'text',
  tags: 'text',
  keywords: 'text'
});

// Virtual for full location
jobSchema.virtual('fullLocation').get(function() {
  const parts = [];
  if (this.location.city) parts.push(this.location.city);
  if (this.location.state) parts.push(this.location.state);
  if (this.location.country) parts.push(this.location.country);
  if (this.location.remote) parts.push('Remote');
  return parts.join(', ');
});

// Virtual for salary range
jobSchema.virtual('salaryRange').get(function() {
  if (!this.salary.min && !this.salary.max) return 'Not specified';
  
  const currency = this.salary.currency || 'USD';
  const period = this.salary.period || 'yearly';
  
  if (this.salary.min && this.salary.max) {
    return `${currency} ${this.salary.min.toLocaleString()} - ${this.salary.max.toLocaleString()} ${period}`;
  } else if (this.salary.min) {
    return `${currency} ${this.salary.min.toLocaleString()}+ ${period}`;
  } else {
    return `${currency} Up to ${this.salary.max.toLocaleString()} ${period}`;
  }
});

// Method to increment views
jobSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment applications
jobSchema.methods.incrementApplications = function() {
  this.applicationCount += 1;
  return this.save();
};

module.exports = mongoose.model('Job', jobSchema); 