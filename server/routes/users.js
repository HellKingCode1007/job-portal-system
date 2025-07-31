const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, candidate, employer } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('employerProfile')
      .populate('candidateProfile');

    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('bio').optional().trim(),
  body('website').optional().isURL(),
  body('location.city').optional().trim(),
  body('location.state').optional().trim(),
  body('location.country').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile fields
    if (req.body.firstName) user.profile.firstName = req.body.firstName;
    if (req.body.lastName) user.profile.lastName = req.body.lastName;
    if (req.body.phone) user.profile.phone = req.body.phone;
    if (req.body.bio) user.profile.bio = req.body.bio;
    if (req.body.website) user.profile.website = req.body.website;
    if (req.body.location) user.profile.location = req.body.location;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        profile: user.profile,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/candidate-profile
// @desc    Update candidate profile
// @access  Private (Candidates only)
router.put('/candidate-profile', [auth, candidate], [
  body('skills').optional().isArray(),
  body('preferredJobTypes').optional().isArray(),
  body('salaryExpectation.min').optional().isFloat({ min: 0 }),
  body('salaryExpectation.max').optional().isFloat({ min: 0 }),
  body('salaryExpectation.currency').optional().trim(),
  body('availability').optional().isIn(['immediately', '2-weeks', '1-month', '3-months', 'negotiable'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.candidateProfile) {
      user.candidateProfile = {};
    }

    // Update candidate profile fields
    if (req.body.skills) user.candidateProfile.skills = req.body.skills;
    if (req.body.preferredJobTypes) user.candidateProfile.preferredJobTypes = req.body.preferredJobTypes;
    if (req.body.salaryExpectation) user.candidateProfile.salaryExpectation = req.body.salaryExpectation;
    if (req.body.availability) user.candidateProfile.availability = req.body.availability;

    await user.save();

    res.json({
      message: 'Candidate profile updated successfully',
      candidateProfile: user.candidateProfile
    });
  } catch (error) {
    console.error('Update candidate profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/candidate-profile/experience
// @desc    Add experience to candidate profile
// @access  Private (Candidates only)
router.post('/candidate-profile/experience', [auth, candidate], [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('company').trim().notEmpty().withMessage('Company name is required'),
  body('location').optional().trim(),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601(),
  body('current').optional().isBoolean(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.candidateProfile) {
      user.candidateProfile = {};
    }

    if (!user.candidateProfile.experience) {
      user.candidateProfile.experience = [];
    }

    const experience = {
      title: req.body.title,
      company: req.body.company,
      location: req.body.location,
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      current: req.body.current || false,
      description: req.body.description
    };

    user.candidateProfile.experience.push(experience);
    await user.save();

    res.json({
      message: 'Experience added successfully',
      experience: experience
    });
  } catch (error) {
    console.error('Add experience error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/candidate-profile/experience/:id
// @desc    Update experience in candidate profile
// @access  Private (Candidates only)
router.put('/candidate-profile/experience/:id', [auth, candidate], [
  body('title').optional().trim().notEmpty(),
  body('company').optional().trim().notEmpty(),
  body('location').optional().trim(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('current').optional().isBoolean(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const experienceIndex = user.candidateProfile?.experience?.findIndex(
      exp => exp._id.toString() === req.params.id
    );

    if (experienceIndex === -1 || experienceIndex === undefined) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    // Update experience fields
    const experience = user.candidateProfile.experience[experienceIndex];
    Object.assign(experience, req.body);

    if (req.body.startDate) experience.startDate = new Date(req.body.startDate);
    if (req.body.endDate) experience.endDate = new Date(req.body.endDate);

    await user.save();

    res.json({
      message: 'Experience updated successfully',
      experience: experience
    });
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/candidate-profile/experience/:id
// @desc    Delete experience from candidate profile
// @access  Private (Candidates only)
router.delete('/candidate-profile/experience/:id', [auth, candidate], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const experienceIndex = user.candidateProfile?.experience?.findIndex(
      exp => exp._id.toString() === req.params.id
    );

    if (experienceIndex === -1 || experienceIndex === undefined) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    user.candidateProfile.experience.splice(experienceIndex, 1);
    await user.save();

    res.json({ message: 'Experience deleted successfully' });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/candidate-profile/education
// @desc    Add education to candidate profile
// @access  Private (Candidates only)
router.post('/candidate-profile/education', [auth, candidate], [
  body('degree').trim().notEmpty().withMessage('Degree is required'),
  body('institution').trim().notEmpty().withMessage('Institution is required'),
  body('field').optional().trim(),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601(),
  body('gpa').optional().isFloat({ min: 0, max: 4 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.candidateProfile) {
      user.candidateProfile = {};
    }

    if (!user.candidateProfile.education) {
      user.candidateProfile.education = [];
    }

    const education = {
      degree: req.body.degree,
      institution: req.body.institution,
      field: req.body.field,
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      gpa: req.body.gpa
    };

    user.candidateProfile.education.push(education);
    await user.save();

    res.json({
      message: 'Education added successfully',
      education: education
    });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/candidate-profile/education/:id
// @desc    Update education in candidate profile
// @access  Private (Candidates only)
router.put('/candidate-profile/education/:id', [auth, candidate], [
  body('degree').optional().trim().notEmpty(),
  body('institution').optional().trim().notEmpty(),
  body('field').optional().trim(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('gpa').optional().isFloat({ min: 0, max: 4 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const educationIndex = user.candidateProfile?.education?.findIndex(
      edu => edu._id.toString() === req.params.id
    );

    if (educationIndex === -1 || educationIndex === undefined) {
      return res.status(404).json({ message: 'Education not found' });
    }

    // Update education fields
    const education = user.candidateProfile.education[educationIndex];
    Object.assign(education, req.body);

    if (req.body.startDate) education.startDate = new Date(req.body.startDate);
    if (req.body.endDate) education.endDate = new Date(req.body.endDate);

    await user.save();

    res.json({
      message: 'Education updated successfully',
      education: education
    });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/candidate-profile/education/:id
// @desc    Delete education from candidate profile
// @access  Private (Candidates only)
router.delete('/candidate-profile/education/:id', [auth, candidate], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const educationIndex = user.candidateProfile?.education?.findIndex(
      edu => edu._id.toString() === req.params.id
    );

    if (educationIndex === -1 || educationIndex === undefined) {
      return res.status(404).json({ message: 'Education not found' });
    }

    user.candidateProfile.education.splice(educationIndex, 1);
    await user.save();

    res.json({ message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/employer-profile
// @desc    Update employer profile
// @access  Private (Employers only)
router.put('/employer-profile', [auth, employer], [
  body('companyName').optional().trim().notEmpty(),
  body('companySize').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
  body('industry').optional().trim(),
  body('companyWebsite').optional().isURL(),
  body('companyDescription').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.employerProfile) {
      user.employerProfile = {};
    }

    // Update employer profile fields
    if (req.body.companyName) user.employerProfile.companyName = req.body.companyName;
    if (req.body.companySize) user.employerProfile.companySize = req.body.companySize;
    if (req.body.industry) user.employerProfile.industry = req.body.industry;
    if (req.body.companyWebsite) user.employerProfile.companyWebsite = req.body.companyWebsite;
    if (req.body.companyDescription) user.employerProfile.companyDescription = req.body.companyDescription;

    await user.save();

    res.json({
      message: 'Employer profile updated successfully',
      employerProfile: user.employerProfile
    });
  } catch (error) {
    console.error('Update employer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/resume
// @desc    Upload resume
// @access  Private (Candidates only)
router.post('/resume', [auth, candidate], async (req, res) => {
  try {
    const { resumeUrl, filename } = req.body;

    if (!resumeUrl) {
      return res.status(400).json({ message: 'Resume URL is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.candidateProfile) {
      user.candidateProfile = {};
    }

    user.candidateProfile.resume = {
      url: resumeUrl,
      filename: filename || 'resume.pdf'
    };

    await user.save();

    res.json({
      message: 'Resume uploaded successfully',
      resume: user.candidateProfile.resume
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/resume
// @desc    Delete resume
// @access  Private (Candidates only)
router.delete('/resume', [auth, candidate], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.candidateProfile?.resume) {
      user.candidateProfile.resume = undefined;
      await user.save();
    }

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 