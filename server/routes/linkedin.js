const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const User = require('../models/User');
const { auth, candidate } = require('../middleware/auth');
const router = express.Router();

// LinkedIn API configuration
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

// @route   GET /api/linkedin/auth-url
// @desc    Get LinkedIn OAuth URL
// @access  Private (Candidates only)
router.get('/auth-url', [auth, candidate], async (req, res) => {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/linkedin/callback`;
    const scope = 'r_liteprofile r_emailaddress w_member_social';
    const state = req.user._id.toString(); // Use user ID as state for security

    const authUrl = `${LINKEDIN_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Get LinkedIn auth URL error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/linkedin/callback
// @desc    Handle LinkedIn OAuth callback
// @access  Public
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ message: 'Missing authorization code or state' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(LINKEDIN_TOKEN_URL, {
      grant_type: 'authorization_code',
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: `${req.protocol}://${req.get('host')}/api/linkedin/callback`
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = tokenResponse.data;

    // Get user profile from LinkedIn
    const profileResponse = await axios.get(`${LINKEDIN_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'X-Restli-Protocol-Version': '2.0.0'
      },
      params: {
        projection: '(id,firstName,lastName,profilePicture,email-address)'
      }
    });

    const linkedinProfile = profileResponse.data;

    // Update user's LinkedIn profile URL
    await User.findByIdAndUpdate(state, {
      'profile.linkedinProfile': `https://www.linkedin.com/in/${linkedinProfile.id}`
    });

    // Redirect to frontend with success message
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/profile?linkedin=success`);
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/profile?linkedin=error`);
  }
});

// @route   POST /api/linkedin/import
// @desc    Import LinkedIn profile data
// @access  Private (Candidates only)
router.post('/import', [auth, candidate], [
  body('accessToken').notEmpty().withMessage('Access token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accessToken } = req.body;

    // Get basic profile information
    const profileResponse = await axios.get(`${LINKEDIN_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      },
      params: {
        projection: '(id,firstName,lastName,profilePicture,email-address)'
      }
    });

    const profile = profileResponse.data;

    // Get detailed profile information
    const detailedProfileResponse = await axios.get(`${LINKEDIN_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      },
      params: {
        projection: '(id,firstName,lastName,profilePicture,email-address,positions,educations,skills)'
      }
    });

    const detailedProfile = detailedProfileResponse.data;

    // Extract and process profile data
    const importedData = {
      profile: {
        firstName: profile.firstName?.localized?.en_US || profile.firstName,
        lastName: profile.lastName?.localized?.en_US || profile.lastName,
        linkedinProfile: `https://www.linkedin.com/in/${profile.id}`
      },
      candidateProfile: {
        skills: [],
        experience: [],
        education: []
      }
    };

    // Process positions (experience)
    if (detailedProfile.positions?.elements) {
      importedData.candidateProfile.experience = detailedProfile.positions.elements.map(position => ({
        title: position.title,
        company: position.companyName,
        location: position.locationName,
        startDate: position.startDate ? new Date(position.startDate.year, position.startDate.month - 1) : null,
        endDate: position.endDate ? new Date(position.endDate.year, position.endDate.month - 1) : null,
        current: position.isCurrent,
        description: position.description || ''
      }));
    }

    // Process education
    if (detailedProfile.educations?.elements) {
      importedData.candidateProfile.education = detailedProfile.educations.elements.map(education => ({
        degree: education.degreeName,
        institution: education.schoolName,
        field: education.fieldOfStudy,
        startDate: education.startDate ? new Date(education.startDate.year) : null,
        endDate: education.endDate ? new Date(education.endDate.year) : null
      }));
    }

    // Process skills (if available)
    if (detailedProfile.skills?.elements) {
      importedData.candidateProfile.skills = detailedProfile.skills.elements.map(skill => skill.name);
    }

    // Update user profile
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Merge imported data with existing data
    Object.assign(user.profile, importedData.profile);
    
    if (!user.candidateProfile) {
      user.candidateProfile = {};
    }
    
    // Merge skills (avoid duplicates)
    const existingSkills = user.candidateProfile.skills || [];
    const newSkills = importedData.candidateProfile.skills.filter(skill => 
      !existingSkills.includes(skill)
    );
    user.candidateProfile.skills = [...existingSkills, ...newSkills];

    // Merge experience (avoid duplicates based on title and company)
    const existingExperience = user.candidateProfile.experience || [];
    const newExperience = importedData.candidateProfile.experience.filter(exp => 
      !existingExperience.some(existing => 
        existing.title === exp.title && existing.company === exp.company
      )
    );
    user.candidateProfile.experience = [...existingExperience, ...newExperience];

    // Merge education (avoid duplicates based on degree and institution)
    const existingEducation = user.candidateProfile.education || [];
    const newEducation = importedData.candidateProfile.education.filter(edu => 
      !existingEducation.some(existing => 
        existing.degree === edu.degree && existing.institution === edu.institution
      )
    );
    user.candidateProfile.education = [...existingEducation, ...newEducation];

    await user.save();

    res.json({
      message: 'LinkedIn profile imported successfully',
      importedData,
      user: {
        id: user._id,
        profile: user.profile,
        candidateProfile: user.candidateProfile
      }
    });
  } catch (error) {
    console.error('LinkedIn import error:', error);
    if (error.response?.status === 401) {
      return res.status(401).json({ message: 'Invalid or expired access token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/linkedin/profile
// @desc    Get LinkedIn profile data (if connected)
// @access  Private (Candidates only)
router.get('/profile', [auth, candidate], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const linkedinData = {
      connected: !!user.profile.linkedinProfile,
      profileUrl: user.profile.linkedinProfile,
      importedData: {
        skills: user.candidateProfile?.skills || [],
        experience: user.candidateProfile?.experience || [],
        education: user.candidateProfile?.education || []
      }
    };

    res.json(linkedinData);
  } catch (error) {
    console.error('Get LinkedIn profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/linkedin/disconnect
// @desc    Disconnect LinkedIn profile
// @access  Private (Candidates only)
router.post('/disconnect', [auth, candidate], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove LinkedIn profile URL
    user.profile.linkedinProfile = undefined;
    await user.save();

    res.json({ message: 'LinkedIn profile disconnected successfully' });
  } catch (error) {
    console.error('Disconnect LinkedIn error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/linkedin/sync
// @desc    Sync LinkedIn profile data
// @access  Private (Candidates only)
router.post('/sync', [auth, candidate], [
  body('accessToken').notEmpty().withMessage('Access token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accessToken } = req.body;

    // Get updated profile information
    const profileResponse = await axios.get(`${LINKEDIN_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      },
      params: {
        projection: '(id,firstName,lastName,positions,educations,skills)'
      }
    });

    const profile = profileResponse.data;

    // Update user's LinkedIn data
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update skills
    if (profile.skills?.elements) {
      user.candidateProfile.skills = profile.skills.elements.map(skill => skill.name);
    }

    // Update experience
    if (profile.positions?.elements) {
      user.candidateProfile.experience = profile.positions.elements.map(position => ({
        title: position.title,
        company: position.companyName,
        location: position.locationName,
        startDate: position.startDate ? new Date(position.startDate.year, position.startDate.month - 1) : null,
        endDate: position.endDate ? new Date(position.endDate.year, position.endDate.month - 1) : null,
        current: position.isCurrent,
        description: position.description || ''
      }));
    }

    // Update education
    if (profile.educations?.elements) {
      user.candidateProfile.education = profile.educations.elements.map(education => ({
        degree: education.degreeName,
        institution: education.schoolName,
        field: education.fieldOfStudy,
        startDate: education.startDate ? new Date(education.startDate.year) : null,
        endDate: education.endDate ? new Date(education.endDate.year) : null
      }));
    }

    await user.save();

    res.json({
      message: 'LinkedIn profile synced successfully',
      user: {
        id: user._id,
        candidateProfile: user.candidateProfile
      }
    });
  } catch (error) {
    console.error('LinkedIn sync error:', error);
    if (error.response?.status === 401) {
      return res.status(401).json({ message: 'Invalid or expired access token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 