import express from 'express';
import uploadMiddleware, { isCloudinaryConfigured } from '../middleware/upload.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/upload
// @desc    Upload single image file (Cloudinary or local storage)
// @access  Protected
router.post('/', authMiddleware, (req, res, next) => {
  console.log('📤 Upload request received');
  console.log('Content-Type:', req.headers['content-type']);
  next();
}, uploadMiddleware.single('image'), async (req, res) => {
  try {
    console.log('📦 File received:', req.file);
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    let imagePath;
    let imageData = {};

    // Check if using Cloudinary (file will have path property with URL)
    if (isCloudinaryConfigured() && req.file.path) {
      // Cloudinary upload - use the secure URL
      imagePath = req.file.path;
      imageData = {
        url: req.file.path,
        publicId: req.file.filename, // Cloudinary public_id
        format: req.file.format,
        width: req.file.width,
        height: req.file.height,
      };
      console.log('☁️ Cloudinary upload successful:', imagePath);
    } else {
      // Local storage - return relative path
      imagePath = `/uploads/${req.file.filename}`;
      imageData = {
        url: imagePath,
        filename: req.file.filename,
      };
      console.log('📁 Local upload successful:', imagePath);
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imagePath,
      filename: req.file.filename,
      storage: isCloudinaryConfigured() ? 'cloudinary' : 'local',
      ...imageData
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload image' 
    });
  }
});

// @route   GET /api/upload/status
// @desc    Get upload configuration status
// @access  Public
router.get('/status', (req, res) => {
  res.json({
    cloudinaryConfigured: isCloudinaryConfigured(),
    storageType: isCloudinaryConfigured() ? 'cloudinary' : 'local',
  });
});

export default router;
