const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['candidate', 'employer', 'admin'],
    default: 'candidate'
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    location: {
      city: String,
      state: String,
      country: String
    },
    avatar: String,
    bio: String,
    website: String,
    linkedinProfile: String,
    githubProfile: String
  },
  // For candidates
  candidateProfile: {
    skills: [String],
    experience: [{
      title: String,
      company: String,
      location: String,
      startDate: Date,
      endDate: Date,
      current: Boolean,
      description: String
    }],
    education: [{
      degree: String,
      institution: String,
      field: String,
      startDate: Date,
      endDate: Date,
      gpa: Number
    }],
    resume: {
      url: String,
      filename: String,
      parsedData: {
        skills: [String],
        experience: [String],
        education: [String]
      }
    },
    preferredJobTypes: [String],
    salaryExpectation: {
      min: Number,
      max: Number,
      currency: String
    },
    availability: {
      type: String,
      enum: ['immediately', '2-weeks', '1-month', '3-months', 'negotiable']
    }
  },
  // For employers
  employerProfile: {
    companyName: {
      type: String,
      required: function() { return this.role === 'employer'; }
    },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    industry: String,
    companyWebsite: String,
    companyDescription: String,
    companyLogo: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    jobAlerts: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Remove password from JSON response
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema); 