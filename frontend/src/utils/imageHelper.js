/**
 * Constructs proper image URL with encoding for special characters
 * @param {string} imagePath - The image path from the database
 * @returns {string} - Full URL to the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    console.log('getImageUrl: No image path provided');
    return null;
  }
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('getImageUrl: Already full URL:', imagePath);
    return imagePath;
  }
  
  // Ensure path starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
  
  // For simple paths without special characters, return as is
  // This handles most cases like /uploads/filename.jpg
  if (!/[^a-zA-Z0-9/_.\-]/.test(normalizedPath)) {
    const url = `http://localhost:5000${normalizedPath}`;
    console.log('getImageUrl: Simple path ->', url);
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
  
  const url = `http://localhost:5000${encodedParts.join('/')}`;
  console.log('getImageUrl: Special chars path ->', url);
  return url;
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
