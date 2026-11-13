/**
 * CONNECT APP BACKOFFICE – CENTRALIZED CLOUDINARY STORAGE SERVICE
 *
 * Primary and exclusive storage service for the Connect App Backoffice portal.
 * Handles images, documents, PDFs, KYC identity proofs, product assets, and admin uploads.
 */

const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Initialize Cloudinary configuration from environment
let isConfigured = false;

function configureCloudinary() {
  if (isConfigured) return cloudinary;

  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudinaryUrl) {
    cloudinary.config({ url: cloudinaryUrl, secure: true });
    isConfigured = true;
  } else if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
    isConfigured = true;
  } else {
    console.warn('[Cloudinary Service] Missing credentials in environment variables.');
  }

  return cloudinary;
}

// Comprehensive MIME allowlist supporting Images, Documents, and Audio
const ALLOWED_MIME_MAP = {
  // Images (Max 15MB)
  'image/jpeg': { ext: 'jpg', category: 'image', maxSizeBytes: 15 * 1024 * 1024, resourceType: 'image' },
  'image/jpg': { ext: 'jpg', category: 'image', maxSizeBytes: 15 * 1024 * 1024, resourceType: 'image' },
  'image/png': { ext: 'png', category: 'image', maxSizeBytes: 15 * 1024 * 1024, resourceType: 'image' },
  'image/webp': { ext: 'webp', category: 'image', maxSizeBytes: 15 * 1024 * 1024, resourceType: 'image' },
  'image/gif': { ext: 'gif', category: 'image', maxSizeBytes: 15 * 1024 * 1024, resourceType: 'image' },
  'image/avif': { ext: 'avif', category: 'image', maxSizeBytes: 15 * 1024 * 1024, resourceType: 'image' },
  'image/svg+xml': { ext: 'svg', category: 'image', maxSizeBytes: 5 * 1024 * 1024, resourceType: 'image' },

  // Documents (Max 25MB)
  'application/pdf': { ext: 'pdf', category: 'document', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'auto' },
  'application/msword': { ext: 'doc', category: 'document', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'raw' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', category: 'document', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'raw' },
  'application/vnd.ms-excel': { ext: 'xls', category: 'document', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'raw' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', category: 'document', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'raw' },
  'text/csv': { ext: 'csv', category: 'document', maxSizeBytes: 10 * 1024 * 1024, resourceType: 'raw' },
  'text/plain': { ext: 'txt', category: 'document', maxSizeBytes: 10 * 1024 * 1024, resourceType: 'raw' },

  // Audio (Max 25MB)
  'audio/webm': { ext: 'webm', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' },
  'video/webm': { ext: 'webm', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' },
  'audio/mpeg': { ext: 'mp3', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' },
  'audio/mp3': { ext: 'mp3', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' },
  'audio/wav': { ext: 'wav', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' },
  'audio/x-wav': { ext: 'wav', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' },
  'audio/wave': { ext: 'wav', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' },
  'audio/m4a': { ext: 'm4a', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' },
  'audio/x-m4a': { ext: 'm4a', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' },
  'audio/mp4': { ext: 'm4a', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' },
  'audio/ogg': { ext: 'ogg', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' },
  'application/ogg': { ext: 'ogg', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' },
  'audio/aac': { ext: 'aac', category: 'audio', maxSizeBytes: 25 * 1024 * 1024, resourceType: 'video' }
};

const EXTENSION_TO_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
  webm: 'audio/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/m4a',
  ogg: 'audio/ogg',
  aac: 'audio/aac'
};

function detectMagicBytes(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) return null;
  // JPEG
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
  // PDF
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'application/pdf';
  // WebM
  if (buf[0] === 0x1A && buf[1] === 0x45 && buf[2] === 0xDF && buf[3] === 0xA3) return 'audio/webm';
  // MP3 ID3
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return 'audio/mpeg';
  // RIFF (WAV or WEBP)
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf.length >= 12) {
    const sub = buf.toString('ascii', 8, 12);
    if (sub === 'WEBP') return 'image/webp';
    if (sub === 'WAVE') return 'audio/wav';
  }
  // OGG
  if (buf[0] === 0x4F && buf[1] === 0x67 && buf[2] === 0x67 && buf[3] === 0x53) return 'audio/ogg';
  // Office OpenXML / ZIP
  if (buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04) return 'application/zip';
  return null;
}

function isCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.trim().startsWith('https://res.cloudinary.com/');
}

function extractCloudinaryPublicId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  if (!trimmed.startsWith('https://res.cloudinary.com/')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split('/');
    // pathname format: /<cloud_name>/<resource_type>/upload/(v<version>/)?<public_id>.<ext>
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex !== -1 && uploadIndex + 1 < parts.length) {
      let publicParts = parts.slice(uploadIndex + 1);
      if (publicParts[0] && /^v\d+$/.test(publicParts[0])) {
        publicParts = publicParts.slice(1);
      }
      const rawPublicId = publicParts.join('/');
      return rawPublicId.replace(/\.[a-zA-Z0-9]+$/, '');
    }
  } catch (_) {}
  return trimmed;
}

/**
 * Uploads a buffer to Cloudinary using streaming upload.
 */
function uploadBufferToCloudinary(buffer, uploadOptions) {
  return new Promise((resolve, reject) => {
    configureCloudinary();
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    uploadStream.end(buffer);
  });
}

/**
 * Centralized upload function for Cloudinary.
 * Accepts Buffers, file paths, base64 data URIs, or remote URLs.
 * Returns a backward-compatible result object matching prior storage responses.
 */
async function uploadToCloudinary(fileBufferOrPath, folder = 'admin_uploads', filenameHint = 'document.pdf', customOptions = {}) {
  try {
    configureCloudinary();

    let buffer = null;
    let hint = filenameHint;
    let isRemoteUrl = false;
    let remoteUrl = '';

    if (Buffer.isBuffer(fileBufferOrPath)) {
      buffer = fileBufferOrPath;
    } else if (typeof fileBufferOrPath === 'string') {
      const trimmed = fileBufferOrPath.trim();

      // If already a Cloudinary URL, return as-is
      if (isCloudinaryUrl(trimmed)) {
        return {
          success: true,
          url: trimmed,
          secure_url: trimmed,
          key: extractCloudinaryPublicId(trimmed),
          publicId: extractCloudinaryPublicId(trimmed),
          category: 'image',
          mimeType: 'image/jpeg',
          size: 0,
          toString() { return trimmed; },
          [Symbol.toPrimitive]() { return trimmed; }
        };
      }

      if (trimmed.startsWith('data:')) {
        const match = trimmed.match(/^data:([^;]+);base64,(.+)$/s);
        if (match) {
          buffer = Buffer.from(match[2], 'base64');
          const extFromMime = ALLOWED_MIME_MAP[match[1].toLowerCase()]?.ext || 'jpg';
          hint = `upload.${extFromMime}`;
        } else {
          throw new Error('Malformed base64 data string');
        }
      } else if (fs.existsSync(trimmed)) {
        buffer = fs.readFileSync(trimmed);
        hint = path.basename(trimmed);
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        isRemoteUrl = true;
        remoteUrl = trimmed;
      } else {
        throw new Error('Invalid file path or data provided for Cloudinary upload');
      }
    } else {
      throw new Error('File payload must be a Buffer, file path, base64 string, or valid URL');
    }

    // Determine extension, MIME type, and category
    let ext = path.extname(hint || '').replace('.', '').toLowerCase() || 'jpg';
    let mimeType = EXTENSION_TO_MIME[ext] || 'application/octet-stream';

    if (buffer) {
      const magicMime = detectMagicBytes(buffer);
      if (magicMime && ALLOWED_MIME_MAP[magicMime]) {
        mimeType = magicMime;
        ext = ALLOWED_MIME_MAP[magicMime].ext;
      }
    }

    const mimeConfig = ALLOWED_MIME_MAP[mimeType] || { category: 'document', maxSizeBytes: 25 * 1024 * 1024, ext, resourceType: 'auto' };

    if (buffer && buffer.length > mimeConfig.maxSizeBytes) {
      const maxMb = Math.round(mimeConfig.maxSizeBytes / (1024 * 1024));
      throw new Error(`Payload size exceeds maximum limit of ${maxMb} MB for ${mimeConfig.category}s.`);
    }

    // Safe folder partitioning under connect_app/
    const safeFolder = String(folder || 'admin_uploads').replace(/[^a-zA-Z0-9_\-\/]/g, '_');
    const folderPath = safeFolder.startsWith('connect_app') ? safeFolder : `connect_app/${safeFolder}`;

    const randSuffix = crypto.randomBytes(6).toString('hex');
    const baseName = path.basename(hint, path.extname(hint)).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const publicId = `${folderPath}/${Date.now()}-${baseName}-${randSuffix}`;

    const uploadOptions = {
      public_id: publicId,
      resource_type: mimeConfig.resourceType || 'auto',
      overwrite: true,
      context: {
        original_name: encodeURIComponent(path.basename(hint || 'file')),
        category: mimeConfig.category,
        document_type: customOptions.documentType || 'general',
        applicant_id: customOptions.applicantId || '',
        kyc_request_id: customOptions.kycRequestId || '',
        version: customOptions.version || '1.0'
      },
      ...customOptions
    };

    let result;
    if (isRemoteUrl) {
      result = await cloudinary.uploader.upload(remoteUrl, uploadOptions);
    } else {
      result = await uploadBufferToCloudinary(buffer, uploadOptions);
    }

    const durableUrl = result.secure_url || result.url;

    const resultObj = {
      success: true,
      url: durableUrl,
      secure_url: durableUrl,
      key: result.public_id,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format || ext,
      originalName: hint,
      size: result.bytes || buffer?.length || 0,
      uploadDate: new Date().toISOString(),
      category: mimeConfig.category,
      mimeType: mimeType,
      extension: ext,
      toString() { return durableUrl; },
      [Symbol.toPrimitive]() { return durableUrl; }
    };

    return resultObj;
  } catch (err) {
    console.error('[Cloudinary Upload Error]:', err.message);
    throw new Error(`Failed to upload file to Cloudinary: ${err.message}`);
  }
}

/**
 * Deletes a file from Cloudinary by Public ID.
 */
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    configureCloudinary();
    const cleanId = extractCloudinaryPublicId(publicId);
    if (!cleanId) return { success: false, error: 'Invalid public ID' };
    const res = await cloudinary.uploader.destroy(cleanId, { resource_type: resourceType });
    return { success: res.result === 'ok', result: res.result };
  } catch (err) {
    console.error('[Cloudinary Delete Error]:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Returns a secure URL for a given public ID.
 */
function getCloudinaryUrl(publicId, options = {}) {
  configureCloudinary();
  const cleanId = extractCloudinaryPublicId(publicId);
  return cloudinary.url(cleanId, {
    secure: true,
    ...options
  });
}

module.exports = {
  configureCloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl,
  isCloudinaryUrl,
  extractCloudinaryPublicId,
  detectMagicBytes,
  ALLOWED_MIME_MAP,
  EXTENSION_TO_MIME
};

