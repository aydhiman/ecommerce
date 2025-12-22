/**
 * Constructs proper image URL with encoding for special characters
 * Supports both local storage (/uploads/...) and Cloudinary URLs
 * @param {string} imagePath - The image path from the database
 * @returns {string} - Full URL to the image
 */
export const getImageUrl = (imagePath) => {
  console.log('getImageUrl called with:', imagePath, typeof imagePath);
  
  if (!imagePath) {
    console.log('getImageUrl: No image path provided');
    return null;
  }
  
  // If already a full URL (Cloudinary or other CDN), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('getImageUrl: Full URL, returning as-is:', imagePath);
    return imagePath;
  }
  
  // Check if it's a Cloudinary URL without protocol
  if (imagePath.includes('cloudinary.com') || imagePath.includes('res.cloudinary')) {
    const url = `https://${imagePath}`;
    console.log('getImageUrl: Cloudinary URL without protocol:', url);
    return url;
  }
  
  // Ensure path starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
  
  // Get backend URL from environment or use default
  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  
  // For simple paths without special characters, return as is
  // This handles most cases like /uploads/filename.jpg
  if (!/[^a-zA-Z0-9/_.\-]/.test(normalizedPath)) {
    const url = `${backendUrl}${normalizedPath}`;
    console.log('getImageUrl: Local path ->', url);
    return url;
  }
  
  // For paths with special characters, encode only the filename part
  const pathParts = normalizedPath.split('/');
  const encodedParts = pathParts.map((part, index) => {
    // Don't encode empty parts (from leading slash) or 'uploads' directory
    if (part === '' || part === 'uploads') {
      return part;
    }
    // Encode the filename
    return encodeURIComponent(part);
  });
  
  const url = `${backendUrl}${encodedParts.join('/')}`;
  console.log('getImageUrl: Encoded path ->', url);
  return url;
};

/**
 * Checks if an image URL is from Cloudinary
 * @param {string} url - The image URL to check
 * @returns {boolean} - True if Cloudinary URL
 */
export const isCloudinaryUrl = (url) => {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary');
};

/**
 * Gets optimized Cloudinary URL with transformations
 * @param {string} url - The Cloudinary URL
 * @param {object} options - Transformation options
 * @returns {string} - Optimized URL
 */
export const getOptimizedCloudinaryUrl = (url, options = {}) => {
  if (!isCloudinaryUrl(url)) return url;
  
  const { width, height, quality = 'auto', format = 'auto' } = options;
  
  // Insert transformation parameters into Cloudinary URL
  // URL format: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{public_id}
  try {
    const transformations = [];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    transformations.push(`q_${quality}`);
    transformations.push(`f_${format}`);
    
    const transformString = transformations.join(',');
    
    // Find /upload/ and insert transformations after it
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;
    
    const before = url.substring(0, uploadIndex + 8); // includes '/upload/'
    const after = url.substring(uploadIndex + 8);
    
    // Check if there are already transformations
    if (after.startsWith('v') || after.match(/^[a-z]_/)) {
      // Already has transformations or version, insert before
      return `${before}${transformString}/${after}`;
    }
    
    return `${before}${transformString}/${after}`;
  } catch (error) {
    console.error('Error optimizing Cloudinary URL:', error);
    return url;
  }
};

/**
 * Gets a placeholder image URL
 * @param {number} width - Width of the placeholder
 * @param {number} height - Height of the placeholder
 * @returns {string} - SVG data URL for placeholder
 */
export const getPlaceholderImage = (width = 200, height = 200) => {
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect fill="%23ddd" width="${width}" height="${height}"/><text x="50%" y="50%" fill="%23999" text-anchor="middle" dy=".3em" font-size="16">No Image</text></svg>`;
};
