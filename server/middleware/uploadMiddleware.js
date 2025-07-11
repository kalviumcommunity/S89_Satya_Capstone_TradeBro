/**
 * Upload Middleware
 * Reusable multer configuration for file uploads
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Ensure upload directories exist
 */
const ensureUploadDirectories = () => {
  const directories = ['uploads', 'uploads/profiles', 'uploads/temp'];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created upload directory: ${dir}`);
    }
  });
};

/**
 * Generate unique filename with timestamp
 * @param {string} originalname - Original filename
 * @param {string} prefix - Optional prefix for filename
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (originalname, prefix = '') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalname);
  const baseName = path.basename(originalname, extension);
  
  return `${prefix}${timestamp}_${randomString}_${baseName}${extension}`;
};

/**
 * Profile image storage configuration
 */
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDirectories();
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const filename = generateUniqueFilename(file.originalname, 'profile_');
    cb(null, filename);
  }
});

/**
 * File filter for images
 * @param {object} req - Express request
 * @param {object} file - Multer file object
 * @param {function} cb - Callback function
 */
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedTypes.includes(file.mimetype) || !allowedExtensions.includes(fileExtension)) {
    const error = new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  cb(null, true);
};

/**
 * Profile image upload configuration
 */
const profileImageUpload = multer({
  storage: profileImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

/**
 * Handle multer errors
 * @param {Error} error - Multer error
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next function
 */
const handleUploadError = (error, req, res, next) => {
  console.error('📤 Upload error:', {
    error: error.message,
    code: error.code,
    field: error.field,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Handle specific multer errors
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'File too large',
          message: 'File size must be less than 5MB',
          code: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files',
          message: 'Only one file can be uploaded at a time',
          code: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field',
          message: 'File field name is not allowed',
          code: 'UNEXPECTED_FILE_FIELD'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Upload error',
          message: error.message,
          code: 'UPLOAD_ERROR'
        });
    }
  }

  // Handle custom file type errors
  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    error: 'Upload failed',
    message: 'An error occurred during file upload',
    code: 'UPLOAD_FAILED'
  });
};

/**
 * Delete uploaded file
 * @param {string} filename - Filename to delete
 * @param {string} directory - Directory path (default: uploads/profiles/)
 * @returns {Promise<boolean>} Success status
 */
const deleteUploadedFile = async (filename, directory = 'uploads/profiles/') => {
  try {
    if (!filename) {
      return false;
    }

    const filePath = path.join(directory, filename);
    
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
      return true;
    } else {
      console.warn(`⚠️ File not found for deletion: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting file:', {
      filename,
      directory,
      error: error.message
    });
    return false;
  }
};

/**
 * Get file info
 * @param {string} filename - Filename
 * @param {string} directory - Directory path
 * @returns {object|null} File information
 */
const getFileInfo = (filename, directory = 'uploads/profiles/') => {
  try {
    if (!filename) {
      return null;
    }

    const filePath = path.join(directory, filename);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return {
        filename,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        exists: true
      };
    }
    
    return {
      filename,
      path: filePath,
      exists: false
    };
  } catch (error) {
    console.error('❌ Error getting file info:', error.message);
    return null;
  }
};

/**
 * Validate uploaded file
 * @param {object} file - Multer file object
 * @returns {object} Validation result
 */
const validateUploadedFile = (file) => {
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided'
    };
  }

  // Check file size (additional validation)
  if (file.size > 5 * 1024 * 1024) {
    return {
      isValid: false,
      error: 'File size exceeds 5MB limit'
    };
  }

  // Check if file was actually saved
  const fileInfo = getFileInfo(file.filename);
  if (!fileInfo || !fileInfo.exists) {
    return {
      isValid: false,
      error: 'File was not saved properly'
    };
  }

  return {
    isValid: true,
    file: {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    }
  };
};

/**
 * Cleanup old profile images
 * @param {string} userId - User ID
 * @param {string} currentFilename - Current filename to keep
 */
const cleanupOldProfileImages = async (userId, currentFilename) => {
  try {
    const profileDir = 'uploads/profiles/';
    const files = await fs.promises.readdir(profileDir);
    
    // Find files that start with profile_ and contain userId pattern
    const userFiles = files.filter(file => 
      file.startsWith('profile_') && 
      file !== currentFilename
    );

    // Delete old files (keep only the latest)
    for (const file of userFiles) {
      const filePath = path.join(profileDir, file);
      const stats = await fs.promises.stat(filePath);
      
      // Delete files older than 24 hours that aren't the current one
      const isOld = Date.now() - stats.mtime.getTime() > 24 * 60 * 60 * 1000;
      if (isOld) {
        await deleteUploadedFile(file);
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning up old profile images:', error.message);
  }
};

module.exports = {
  profileImageUpload,
  handleUploadError,
  deleteUploadedFile,
  getFileInfo,
  validateUploadedFile,
  cleanupOldProfileImages,
  ensureUploadDirectories
};
