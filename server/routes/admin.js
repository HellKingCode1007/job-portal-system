const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { auth, admin } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', [auth, admin], async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    // Get job statistics
    const jobStats = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: ['$approved', 1, 0] }
          }
        }
      }
    ]);

    // Get application statistics
    const applicationStats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent activities
    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('company', 'profile employerProfile');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('profile role isActive createdAt');

    const recentApplications = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('job', 'title')
      .populate('applicant', 'profile')
      .populate('employer', 'profile employerProfile');

    // Calculate totals
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();
    const pendingApprovals = await Job.countDocuments({ approved: false });

    res.json({
      stats: {
        users: userStats,
        jobs: jobStats,
        applications: applicationStats,
        totals: {
          users: totalUsers,
          jobs: totalJobs,
          applications: totalApplications,
          pendingApprovals
        }
      },
      recent: {
        jobs: recentJobs,
        users: recentUsers,
        applications: recentApplications
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filtering
// @access  Private (Admin only)
router.get('/users', [auth, admin], [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['candidate', 'employer', 'admin']),
  query('status').optional().isIn(['active', 'inactive']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, role, status, search } = req.query;
    const filter = {};

    // Apply filters
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (search) {
      filter.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1
      },
      total
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private (Admin only)
router.put('/users/:id/status', [auth, admin], [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/users/:id/role', [auth, admin], [
  body('role').isIn(['candidate', 'employer', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/jobs
// @desc    Get all jobs with filtering
// @access  Private (Admin only)
router.get('/jobs', [auth, admin], [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'paused', 'closed', 'draft']),
  query('approved').optional().isBoolean(),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, status, approved, search } = req.query;
    const filter = {};

    // Apply filters
    if (status) filter.status = status;
    if (approved !== undefined) filter.approved = approved === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(filter)
      .populate('company', 'profile employerProfile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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
    console.error('Get admin jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/jobs/:id/approve
// @desc    Approve a job
// @access  Private (Admin only)
router.post('/jobs/:id/approve', [auth, admin], async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.approved = true;
    job.approvedBy = req.user._id;
    job.approvedAt = new Date();
    await job.save();

    res.json({
      message: 'Job approved successfully',
      job: {
        id: job._id,
        title: job.title,
        companyName: job.companyName,
        approved: job.approved,
        approvedAt: job.approvedAt
      }
    });
  } catch (error) {
    console.error('Approve job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/jobs/:id/reject
// @desc    Reject a job
// @access  Private (Admin only)
router.post('/jobs/:id/reject', [auth, admin], [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.approved = false;
    job.status = 'closed';
    await job.save();

    res.json({
      message: 'Job rejected successfully',
      job: {
        id: job._id,
        title: job.title,
        companyName: job.companyName,
        approved: job.approved,
        status: job.status
      }
    });
  } catch (error) {
    console.error('Reject job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/applications
// @desc    Get all applications with filtering
// @access  Private (Admin only)
router.get('/applications', [auth, admin], [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['applied', 'reviewing', 'shortlisted', 'interview-scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};

    // Apply filters
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { 'job.title': { $regex: search, $options: 'i' } },
        { 'applicant.profile.firstName': { $regex: search, $options: 'i' } },
        { 'applicant.profile.lastName': { $regex: search, $options: 'i' } },
        { 'employer.profile.firstName': { $regex: search, $options: 'i' } },
        { 'employer.profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(filter)
      .populate('job', 'title companyName')
      .populate('applicant', 'profile')
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
    console.error('Get admin applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get system analytics
// @access  Private (Admin only)
router.get('/analytics', [auth, admin], async (req, res) => {
  try {
    // User growth over time
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Job posting trends
    const jobTrends = await Job.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          approved: { $sum: { $cond: ['$approved', 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Application trends
    const applicationTrends = await Application.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top industries
    const topIndustries = await Job.aggregate([
      { $match: { approved: true } },
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Top job types
    const topJobTypes = await Job.aggregate([
      { $match: { approved: true } },
      {
        $group: {
          _id: '$jobType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Application status distribution
    const applicationStatusDistribution = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      userGrowth,
      jobTrends,
      applicationTrends,
      topIndustries,
      topJobTypes,
      applicationStatusDistribution
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/employers/:id/verify
// @desc    Verify an employer
// @access  Private (Admin only)
router.post('/employers/:id/verify', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'employer') {
      return res.status(400).json({ message: 'User is not an employer' });
    }

    user.employerProfile.verified = true;
    await user.save();

    res.json({
      message: 'Employer verified successfully',
      user: {
        id: user._id,
        email: user.email,
        companyName: user.employerProfile.companyName,
        verified: user.employerProfile.verified
      }
    });
  } catch (error) {
    console.error('Verify employer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 