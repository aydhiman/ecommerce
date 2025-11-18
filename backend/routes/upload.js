import express from 'express';
import uploadMiddleware from '../middleware/upload.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/upload
// @desc    Upload single image file
// @access  Protected
router.post('/', authMiddleware, uploadMiddleware.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // Return the file path
    const imagePath = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imagePath,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload image' 
    });
  }
});

export default router;
