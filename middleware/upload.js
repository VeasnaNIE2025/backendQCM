
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('../config/cloudinary');

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'exam_questions',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
//     transformation: [{ width: 800, height: 600, crop: 'limit' }]
//   }
// });

// const upload = multer({ storage: storage });

// module.exports = upload;


const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ── 1. Storage សម្រាប់ រូបភាព (មានហើយ) ─────────────────
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'exam_questions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  }
});

// ── 2. Storage សម្រាប់ ឯកសារ PDF/Word/Excel (ថ្មី) ───────
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'homework_submissions',
      resource_type: 'raw',
      public_id: `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`,
      format: undefined
    };
  }
});

// ── 3. File Filter សម្រាប់ ឯកសារ (ថ្មី) ─────────────────
const documentFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('រក្សាទុកបានតែ PDF, Word, Excel ប៉ុណ្ណោះ!'), false);
  }
};

// ── 4. Export ទាំងពីរ ────────────────────────────────────
const upload = multer({ storage: imageStorage });           // ចាស់ — រូបភាព

const uploadDocument = multer({                             // ថ្មី — ឯកសារ
  storage:    documentStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 }                  // 10MB
});

module.exports = { upload, uploadDocument };