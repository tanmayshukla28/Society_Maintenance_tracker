const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Strategy: "local" (default) saves files to /uploads and serves them statically.
// Strategy: "cloudinary" uploads to Cloudinary and stores the returned secure_url.
// This keeps the project runnable out-of-the-box with zero external accounts,
// while still being production-ready if you add Cloudinary keys later.

const strategy = process.env.UPLOAD_STRATEGY || 'local';

const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const maxSize = 5 * 1024 * 1024; // 5MB

function fileFilter(req, file, cb) {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
  }
  cb(null, true);
}

let storage;
if (strategy === 'local') {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
    filename: (req, file, cb) => {
      const unique = crypto.randomBytes(8).toString('hex');
      cb(null, `${Date.now()}-${unique}${path.extname(file.originalname)}`);
    },
  });
} else {
  // for cloudinary strategy we buffer the file and upload manually in the controller
  storage = multer.memoryStorage();
}

const upload = multer({ storage, fileFilter, limits: { fileSize: maxSize } });

module.exports = upload;
