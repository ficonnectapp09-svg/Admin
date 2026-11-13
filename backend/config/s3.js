/**
 * CONNECT APP BACKOFFICE – CLOUDINARY MIGRATION COMPATIBILITY SHIM
 *
 * AWS S3 has been permanently replaced by Cloudinary.
 * This shim ensures 100% backward compatibility for any legacy callers
 * by delegating all upload, URL generation, and key extraction to Cloudinary.
 */

const {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl,
  isCloudinaryUrl,
  extractCloudinaryPublicId,
  detectMagicBytes,
  ALLOWED_MIME_MAP,
  EXTENSION_TO_MIME
} = require('./cloudinary');

module.exports = {
  // Aliases for full backward compatibility
  uploadToS3: uploadToCloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getPresignedUrl: (publicId, options) => getCloudinaryUrl(publicId, options),
  getDurableImageUrl: (publicId, options) => getCloudinaryUrl(publicId, options),
  resolveDurableImageUrl: (urlOrId) => (isCloudinaryUrl(urlOrId) ? urlOrId : getCloudinaryUrl(urlOrId)),
  extractS3Key: extractCloudinaryPublicId,
  isCloudinaryUrl,
  detectMagicBytes,
  ALLOWED_MIME_MAP,
  EXTENSION_TO_MIME
};
