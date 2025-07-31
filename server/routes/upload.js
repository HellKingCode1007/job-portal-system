const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth } = require('../middleware/auth');
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, DOC, DOCX for resumes
    if (file.fieldname === 'resume') {
      if (file.mimetype === 'application/pdf' || 
          file.mimetype === 'application/msword' || 
          file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes'), false);
      }
    }
    // Allow images for avatars and company logos
    else if (file.fieldname === 'avatar' || file.fieldname === 'logo') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
    // Allow any file for general uploads
    else {
      cb(null, true);
    }
  }
});

// @route   POST /api/upload/resume
// @desc    Upload resume file
// @access  Private
router.post('/resume', [auth, upload.single('resume')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'resumes',
          resource_type: 'raw',
          format: 'pdf',
          public_id: `resume_${req.user._id}_${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    res.json({
      message: 'Resume uploaded successfully',
      file: {
        url: result.secure_url,
        filename: req.file.originalname,
        size: req.file.size,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ message: 'Error uploading resume' });
  }
});

// @route   POST /api/upload/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', [auth, upload.single('avatar')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          width: 300,
          height: 300,
          crop: 'fill',
          gravity: 'face',
          public_id: `avatar_${req.user._id}_${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    res.json({
      message: 'Avatar uploaded successfully',
      file: {
        url: result.secure_url,
        filename: req.file.originalname,
        size: req.file.size,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Error uploading avatar' });
  }
});

// @route   POST /api/upload/logo
// @desc    Upload company logo
// @access  Private (Employers only)
router.post('/logo', [auth, upload.single('logo')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'logos',
          width: 200,
          height: 200,
          crop: 'fill',
          public_id: `logo_${req.user._id}_${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    res.json({
      message: 'Logo uploaded successfully',
      file: {
        url: result.secure_url,
        filename: req.file.originalname,
        size: req.file.size,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ message: 'Error uploading logo' });
  }
});

// @route   POST /api/upload/document
// @desc    Upload general document
// @access  Private
router.post('/document', [auth, upload.single('document')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'documents',
          resource_type: 'raw',
          public_id: `doc_${req.user._id}_${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    res.json({
      message: 'Document uploaded successfully',
      file: {
        url: result.secure_url,
        filename: req.file.originalname,
        size: req.file.size,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Error uploading document' });
  }
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete uploaded file
// @access  Private
router.delete('/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(400).json({ message: 'Error deleting file' });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: 'File upload error' });
  }
  
  if (error.message) {
    return res.status(400).json({ message: error.message });
  }
  
  next(error);
});

module.exports = router; 