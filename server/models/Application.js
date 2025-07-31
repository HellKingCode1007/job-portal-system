const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['applied', 'reviewing', 'shortlisted', 'interview-scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'],
    default: 'applied'
  },
  coverLetter: {
    type: String,
    required: true,
    maxlength: 2000
  },
  resume: {
    url: String,
    filename: String
  },
  additionalFiles: [{
    name: String,
    url: String,
    type: String
  }],
  answers: [{
    question: String,
    answer: String,
    fileUrl: String
  }],
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  skills: [String],
  experience: [String],
  education: [String],
  // Interview details
  interview: {
    scheduled: {
      type: Boolean,
      default: false
    },
    date: Date,
    time: String,
    type: {
      type: String,
      enum: ['phone', 'video', 'in-person'],
      default: 'video'
    },
    location: String,
    meetingLink: String,
    notes: String,
    interviewer: {
      name: String,
      email: String,
      role: String
    }
  },
  // Communication history
  communications: [{
    type: {
      type: String,
      enum: ['email', 'message', 'note'],
      required: true
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: String,
    message: {
      type: String,
      required: true
    },
    attachments: [{
      name: String,
      url: String
    }],
    read: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Evaluation and feedback
  evaluation: {
    technicalSkills: {
      type: Number,
      min: 1,
      max: 5
    },
    communicationSkills: {
      type: Number,
      min: 1,
      max: 5
    },
    culturalFit: {
      type: Number,
      min: 1,
      max: 5
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String,
    strengths: [String],
    areasForImprovement: [String],
    recommended: {
      type: Boolean,
      default: false
    }
  },
  // Timeline tracking
  timeline: [{
    action: {
      type: String,
      enum: ['applied', 'viewed', 'shortlisted', 'interview-scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  // Offer details
  offer: {
    salary: {
      amount: Number,
      currency: String,
      period: String
    },
    benefits: [String],
    startDate: Date,
    terms: String,
    deadline: Date,
    accepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: Date
  },
  // Flags and metadata
  isFavorite: {
    type: Boolean,
    default: false
  },
  tags: [String],
  notes: String,
  // Auto-archive settings
  autoArchive: {
    type: Boolean,
    default: false
  },
  archivedAt: Date
}, {
  timestamps: true
});

// Indexes for performance
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, status: 1 });
applicationSchema.index({ employer: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });

// Pre-save middleware to update timeline
applicationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      action: this.status,
      date: new Date(),
      performedBy: this.employer // This will be updated in the route handler
    });
  }
  next();
});

// Virtual for application age
applicationSchema.virtual('age').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to add communication
applicationSchema.methods.addCommunication = function(communication) {
  this.communications.push(communication);
  return this.save();
};

// Method to update status
applicationSchema.methods.updateStatus = function(newStatus, performedBy, notes = '') {
  this.status = newStatus;
  this.timeline.push({
    action: newStatus,
    date: new Date(),
    performedBy: performedBy,
    notes: notes
  });
  return this.save();
};

// Method to calculate match score
applicationSchema.methods.calculateMatchScore = function() {
  // This is a simplified scoring algorithm
  // In a real implementation, you might use more sophisticated matching
  let score = 0;
  
  if (this.skills && this.skills.length > 0) {
    score += Math.min(this.skills.length * 10, 50); // Max 50 points for skills
  }
  
  if (this.experience && this.experience.length > 0) {
    score += Math.min(this.experience.length * 5, 30); // Max 30 points for experience
  }
  
  if (this.education && this.education.length > 0) {
    score += Math.min(this.education.length * 5, 20); // Max 20 points for education
  }
  
  this.matchScore = Math.min(score, 100);
  return this.save();
};

module.exports = mongoose.model('Application', applicationSchema); 