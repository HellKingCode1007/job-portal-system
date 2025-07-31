const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Job = require('../models/Job');
const User = require('../models/User');
const { auth, employer, admin, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/jobs
// @desc    Get all jobs with filtering and search
// @access  Public
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().trim(),
  query('location').optional().trim(),
  query('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance']),
  query('industry').optional().trim(),
  query('level').optional().isIn(['entry', 'junior', 'mid', 'senior', 'lead', 'executive']),
  query('remote').optional().isBoolean(),
  query('salaryMin').optional().isFloat({ min: 0 }),
  query('salaryMax').optional().isFloat({ min: 0 }),
  query('sort').optional().isIn(['newest', 'oldest', 'salary-high', 'salary-low', 'relevance'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      search,
      location,
      jobType,
      industry,
      level,
      remote,
      salaryMin,
      salaryMax,
      sort = 'newest'
    } = req.query;

    // Build filter object
    const filter = { status: 'active', approved: true };

    // Search functionality
    if (search) {
      filter.$text = { $search: search };
    }

    // Location filter
    if (location) {
      filter.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } }
      ];
    }

    // Other filters
    if (jobType) filter.jobType = jobType;
    if (industry) filter.industry = { $regex: industry, $options: 'i' };
    if (level) filter.level = level;
    if (remote !== undefined) filter['location.remote'] = remote === 'true';

    // Salary filter
    if (salaryMin || salaryMax) {
      filter.salary = {};
      if (salaryMin) filter.salary.$gte = parseFloat(salaryMin);
      if (salaryMax) filter.salary.$lte = parseFloat(salaryMax);
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'salary-high':
        sortObj = { 'salary.max': -1 };
        break;
      case 'salary-low':
        sortObj = { 'salary.min': 1 };
        break;
      case 'relevance':
        if (search) {
          sortObj = { score: { $meta: 'textScore' } };
        } else {
          sortObj = { createdAt: -1 };
        }
        break;
    }

    // Add featured jobs first
    if (sort === 'newest') {
      sortObj = { isFeatured: -1, ...sortObj };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const jobs = await Job.find(filter)
      .populate('company', 'profile employerProfile')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Job.countDocuments(filter);

    // Calculate match scores for authenticated candidates
    if (req.user && req.user.role === 'candidate') {
      for (let job of jobs) {
        job.matchScore = calculateJobMatch(job, req.user);
      }
      
      // Sort by match score if user is searching
      if (search && sort === 'relevance') {
        jobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      }
    }

    res.json({
      jobs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + jobs.length < total,
        hasPrev: parseInt(page) > 1
      },
      total
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get job by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'profile employerProfile')
      .lean();

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment views
    await Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Calculate match score for candidates
    if (req.user && req.user.role === 'candidate') {
      job.matchScore = calculateJobMatch(job, req.user);
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private (Employers only)
router.post('/', [auth, employer], [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('description').trim().notEmpty().withMessage('Job description is required'),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance']),
  body('industry').trim().notEmpty(),
  body('location.city').optional().trim(),
  body('location.state').optional().trim(),
  body('location.country').optional().trim(),
  body('location.remote').optional().isBoolean(),
  body('requirements.skills').optional().isArray(),
  body('salary.min').optional().isFloat({ min: 0 }),
  body('salary.max').optional().isFloat({ min: 0 }),
  body('benefits').optional().isArray(),
  body('applicationDeadline').optional().isISO8601(),
  body('startDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const jobData = {
      ...req.body,
      company: req.user._id,
      companyName: req.user.employerProfile.companyName
    };

    // Auto-approve if user is admin or verified employer
    if (req.user.role === 'admin' || req.user.employerProfile.verified) {
      jobData.approved = true;
      jobData.approvedBy = req.user._id;
      jobData.approvedAt = new Date();
    }

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('company', 'profile employerProfile');

    res.status(201).json(populatedJob);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job
// @access  Private (Job owner or admin)
router.put('/:id', auth, [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance']),
  body('industry').optional().trim().notEmpty(),
  body('status').optional().isIn(['active', 'paused', 'closed', 'draft'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user can edit this job
    if (job.company.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this job' });
    }

    // Update job
    Object.assign(job, req.body);
    await job.save();

    const updatedJob = await Job.findById(job._id)
      .populate('company', 'profile employerProfile');

    res.json(updatedJob);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job
// @access  Private (Job owner or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user can delete this job
    if (job.company.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/jobs/employer/my-jobs
// @desc    Get jobs posted by the authenticated employer
// @access  Private (Employers only)
router.get('/employer/my-jobs', [auth, employer], async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { company: req.user._id };
    
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('company', 'profile employerProfile');

    const total = await Job.countDocuments(filter);

    res.json({
      jobs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + jobs.length < total,
        hasPrev: parseInt(page) > 1
      },
      total
    });
  } catch (error) {
    console.error('Get employer jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/jobs/recommended
// @desc    Get recommended jobs for candidate
// @access  Private (Candidates only)
router.get('/recommended', auth, async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ message: 'Only candidates can access recommended jobs' });
    }

    const { limit = 10 } = req.query;
    
    // Get candidate's skills and preferences
    const candidateSkills = req.user.candidateProfile?.skills || [];
    const preferredJobTypes = req.user.candidateProfile?.preferredJobTypes || [];
    const location = req.user.profile?.location;

    // Build filter for recommended jobs
    const filter = { 
      status: 'active', 
      approved: true 
    };

    // Filter by skills if available
    if (candidateSkills.length > 0) {
      filter['requirements.skills'] = { $in: candidateSkills };
    }

    // Filter by preferred job types
    if (preferredJobTypes.length > 0) {
      filter.jobType = { $in: preferredJobTypes };
    }

    // Filter by location if available
    if (location?.city || location?.state || location?.country) {
      filter.$or = [];
      if (location.city) filter.$or.push({ 'location.city': { $regex: location.city, $options: 'i' } });
      if (location.state) filter.$or.push({ 'location.state': { $regex: location.state, $options: 'i' } });
      if (location.country) filter.$or.push({ 'location.country': { $regex: location.country, $options: 'i' } });
      filter.$or.push({ 'location.remote': true }); // Include remote jobs
    }

    const jobs = await Job.find(filter)
      .populate('company', 'profile employerProfile')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Calculate match scores
    for (let job of jobs) {
      job.matchScore = calculateJobMatch(job, req.user);
    }

    // Sort by match score
    jobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    res.json(jobs);
  } catch (error) {
    console.error('Get recommended jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/jobs/:id/approve
// @desc    Approve a job (admin only)
// @access  Private (Admin only)
router.post('/:id/approve', [auth, admin], async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.approved = true;
    job.approvedBy = req.user._id;
    job.approvedAt = new Date();
    await job.save();

    res.json({ message: 'Job approved successfully', job });
  } catch (error) {
    console.error('Approve job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to calculate job match score
function calculateJobMatch(job, user) {
  if (user.role !== 'candidate') return null;

  let score = 0;
  const candidateSkills = user.candidateProfile?.skills || [];
  const jobSkills = job.requirements?.skills || [];

  // Skill matching (50 points max)
  if (candidateSkills.length > 0 && jobSkills.length > 0) {
    const matchingSkills = candidateSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );
    score += (matchingSkills.length / Math.max(candidateSkills.length, jobSkills.length)) * 50;
  }

  // Location matching (20 points max)
  const userLocation = user.profile?.location;
  if (userLocation && job.location) {
    if (job.location.remote) {
      score += 20; // Full points for remote jobs
    } else if (userLocation.city && job.location.city && 
               userLocation.city.toLowerCase() === job.location.city.toLowerCase()) {
      score += 20;
    } else if (userLocation.state && job.location.state && 
               userLocation.state.toLowerCase() === job.location.state.toLowerCase()) {
      score += 15;
    } else if (userLocation.country && job.location.country && 
               userLocation.country.toLowerCase() === job.location.country.toLowerCase()) {
      score += 10;
    }
  }

  // Job type preference (15 points max)
  const preferredJobTypes = user.candidateProfile?.preferredJobTypes || [];
  if (preferredJobTypes.includes(job.jobType)) {
    score += 15;
  }

  // Experience level matching (15 points max)
  const userExperience = user.candidateProfile?.experience?.length || 0;
  const jobLevel = job.level;
  
  if (jobLevel === 'entry' && userExperience <= 1) score += 15;
  else if (jobLevel === 'junior' && userExperience <= 3) score += 15;
  else if (jobLevel === 'mid' && userExperience >= 2 && userExperience <= 7) score += 15;
  else if (jobLevel === 'senior' && userExperience >= 5) score += 15;
  else if (jobLevel === 'lead' && userExperience >= 7) score += 15;
  else if (jobLevel === 'executive' && userExperience >= 10) score += 15;

  return Math.round(score);
}

module.exports = router; 