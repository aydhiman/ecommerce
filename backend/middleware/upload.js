// Upload middleware supporting both local storage and Cloudinary
// Uses Cloudinary when configured, falls back to local storage

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { cloudinaryUpload, isCloudinaryConfigured } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File filter for allowed image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Local disk storage configuration (fallback)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Remove spaces and special characters from original filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
    cb(null, uniqueSuffix + '-' + sanitizedName);
  },
});

// Local upload instance
const localUpload = multer({ 
  storage: localStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Export the appropriate upload middleware based on configuration
// Use Cloudinary if configured, otherwise use local storage
const uploadMiddleware = isCloudinaryConfigured() ? cloudinaryUpload : localUpload;

// Log which storage is being used
if (isCloudinaryConfigured()) {
  console.log('☁️ Using Cloudinary for image uploads');
} else {
  console.log('📁 Using local storage for image uploads (Cloudinary not configured)');
}

export default uploadMiddleware;
export { isCloudinaryConfigured };