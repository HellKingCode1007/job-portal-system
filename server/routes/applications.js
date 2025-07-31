const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { auth, employer, candidate, admin } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/applications
// @desc    Submit a job application
// @access  Private (Candidates only)
router.post('/', [auth, candidate], [
  body('jobId').isMongoId().withMessage('Valid job ID is required'),
  body('coverLetter').trim().notEmpty().withMessage('Cover letter is required'),
  body('coverLetter').isLength({ max: 2000 }).withMessage('Cover letter must be less than 2000 characters'),
  body('resume').optional().isURL().withMessage('Resume must be a valid URL'),
  body('answers').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobId, coverLetter, resume, answers, additionalFiles } = req.body;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'active' || !job.approved) {
      return res.status(400).json({ message: 'This job is not accepting applications' });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // Get candidate's skills and experience for matching
    const candidateSkills = req.user.candidateProfile?.skills || [];
    const candidateExperience = req.user.candidateProfile?.experience || [];
    const candidateEducation = req.user.candidateProfile?.education || [];

    // Create application
    const application = new Application({
      job: jobId,
      applicant: req.user._id,
      employer: job.company,
      coverLetter,
      resume: resume ? { url: resume } : undefined,
      additionalFiles: additionalFiles || [],
      answers: answers || [],
      skills: candidateSkills,
      experience: candidateExperience.map(exp => exp.title),
      education: candidateEducation.map(edu => edu.degree)
    });

    await application.save();

    // Calculate match score
    await application.calculateMatchScore();

    // Increment job application count
    await job.incrementApplications();

    // Populate the application with job and user details
    const populatedApplication = await Application.findById(application._id)
      .populate('job')
      .populate('applicant', 'profile candidateProfile')
      .populate('employer', 'profile employerProfile');

    res.status(201).json({
      message: 'Application submitted successfully',
      application: populatedApplication
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/applications
// @desc    Get applications (filtered by user role)
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['applied', 'reviewing', 'shortlisted', 'interview-scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn']),
  query('jobId').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10, status, jobId } = req.query;
    const filter = {};

    // Filter by user role
    if (req.user.role === 'candidate') {
      filter.applicant = req.user._id;
    } else if (req.user.role === 'employer') {
      filter.employer = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admin can see all applications
    }

    // Additional filters
    if (status) filter.status = status;
    if (jobId) filter.job = jobId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(filter)
      .populate('job')
      .populate('applicant', 'profile candidateProfile')
      .populate('employer', 'profile employerProfile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(filter);

    res.json({
      applications,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + applications.length < total,
        hasPrev: parseInt(page) > 1
      },
      total
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/applications/:id
// @desc    Get application by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('applicant', 'profile candidateProfile')
      .populate('employer', 'profile employerProfile');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user can view this application
    if (req.user.role === 'candidate' && application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    if (req.user.role === 'employer' && application.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/applications/:id/status
// @desc    Update application status
// @access  Private (Employer or Admin)
router.put('/:id/status', [auth, employer], [
  body('status').isIn(['applied', 'reviewing', 'shortlisted', 'interview-scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user can update this application
    if (application.employer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Update status
    await application.updateStatus(status, req.user._id, notes);

    const updatedApplication = await Application.findById(application._id)
      .populate('job')
      .populate('applicant', 'profile candidateProfile')
      .populate('employer', 'profile employerProfile');

    res.json({
      message: 'Application status updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/applications/:id/interview
// @desc    Schedule interview
// @access  Private (Employer or Admin)
router.post('/:id/interview', [auth, employer], [
  body('date').isISO8601().withMessage('Valid interview date is required'),
  body('time').trim().notEmpty().withMessage('Interview time is required'),
  body('type').isIn(['phone', 'video', 'in-person']),
  body('location').optional().trim(),
  body('meetingLink').optional().isURL(),
  body('notes').optional().trim(),
  body('interviewer.name').trim().notEmpty(),
  body('interviewer.email').isEmail(),
  body('interviewer.role').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user can schedule interview for this application
    if (application.employer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to schedule interview for this application' });
    }

    // Update interview details
    application.interview = {
      scheduled: true,
      date: req.body.date,
      time: req.body.time,
      type: req.body.type,
      location: req.body.location,
      meetingLink: req.body.meetingLink,
      notes: req.body.notes,
      interviewer: {
        name: req.body.interviewer.name,
        email: req.body.interviewer.email,
        role: req.body.interviewer.role
      }
    };

    // Update status to interview-scheduled
    await application.updateStatus('interview-scheduled', req.user._id, 'Interview scheduled');

    const updatedApplication = await Application.findById(application._id)
      .populate('job')
      .populate('applicant', 'profile candidateProfile')
      .populate('employer', 'profile employerProfile');

    res.json({
      message: 'Interview scheduled successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/applications/:id/evaluate
// @desc    Evaluate application
// @access  Private (Employer or Admin)
router.post('/:id/evaluate', [auth, employer], [
  body('technicalSkills').optional().isInt({ min: 1, max: 5 }),
  body('communicationSkills').optional().isInt({ min: 1, max: 5 }),
  body('culturalFit').optional().isInt({ min: 1, max: 5 }),
  body('overallRating').optional().isInt({ min: 1, max: 5 }),
  body('notes').optional().trim(),
  body('strengths').optional().isArray(),
  body('areasForImprovement').optional().isArray(),
  body('recommended').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user can evaluate this application
    if (application.employer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to evaluate this application' });
    }

    // Update evaluation
    application.evaluation = {
      ...application.evaluation,
      ...req.body
    };

    await application.save();

    const updatedApplication = await Application.findById(application._id)
      .populate('job')
      .populate('applicant', 'profile candidateProfile')
      .populate('employer', 'profile employerProfile');

    res.json({
      message: 'Application evaluated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Evaluate application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/applications/:id/offer
// @desc    Make job offer
// @access  Private (Employer or Admin)
router.post('/:id/offer', [auth, employer], [
  body('salary.amount').isFloat({ min: 0 }),
  body('salary.currency').optional().trim(),
  body('salary.period').optional().isIn(['hourly', 'monthly', 'yearly']),
  body('benefits').optional().isArray(),
  body('startDate').isISO8601(),
  body('terms').optional().trim(),
  body('deadline').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user can make offer for this application
    if (application.employer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to make offer for this application' });
    }

    // Update offer details
    application.offer = {
      salary: {
        amount: req.body.salary.amount,
        currency: req.body.salary.currency || 'USD',
        period: req.body.salary.period || 'yearly'
      },
      benefits: req.body.benefits || [],
      startDate: req.body.startDate,
      terms: req.body.terms,
      deadline: req.body.deadline
    };

    // Update status to offered
    await application.updateStatus('offered', req.user._id, 'Job offer made');

    const updatedApplication = await Application.findById(application._id)
      .populate('job')
      .populate('applicant', 'profile candidateProfile')
      .populate('employer', 'profile employerProfile');

    res.json({
      message: 'Job offer made successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Make offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/applications/:id/accept-offer
// @desc    Accept job offer
// @access  Private (Candidate only)
router.post('/:id/accept-offer', [auth, candidate], async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user can accept offer for this application
    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept offer for this application' });
    }

    if (application.status !== 'offered') {
      return res.status(400).json({ message: 'No offer to accept' });
    }

    // Accept offer
    application.offer.accepted = true;
    application.offer.acceptedAt = new Date();

    // Update status to hired
    await application.updateStatus('hired', req.user._id, 'Offer accepted');

    const updatedApplication = await Application.findById(application._id)
      .populate('job')
      .populate('applicant', 'profile candidateProfile')
      .populate('employer', 'profile employerProfile');

    res.json({
      message: 'Offer accepted successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/applications/:id/withdraw
// @desc    Withdraw application
// @access  Private (Candidate only)
router.post('/:id/withdraw', [auth, candidate], async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user can withdraw this application
    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to withdraw this application' });
    }

    if (application.status === 'hired' || application.status === 'withdrawn') {
      return res.status(400).json({ message: 'Cannot withdraw application in current status' });
    }

    // Update status to withdrawn
    await application.updateStatus('withdrawn', req.user._id, 'Application withdrawn by candidate');

    const updatedApplication = await Application.findById(application._id)
      .populate('job')
      .populate('applicant', 'profile candidateProfile')
      .populate('employer', 'profile employerProfile');

    res.json({
      message: 'Application withdrawn successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/applications/stats/dashboard
// @desc    Get application statistics for dashboard
// @access  Private
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'candidate') {
      filter.applicant = req.user._id;
    } else if (req.user.role === 'employer') {
      filter.employer = req.user._id;
    }

    const stats = await Application.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await Application.countDocuments(filter);
    const recentApplications = await Application.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('job', 'title companyName')
      .populate('applicant', 'profile')
      .populate('employer', 'profile employerProfile');

    res.json({
      stats,
      totalApplications,
      recentApplications
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 