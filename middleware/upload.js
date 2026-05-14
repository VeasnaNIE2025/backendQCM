// // const multer = require('multer');
// // const { CloudinaryStorage } = require('multer-storage-cloudinary');
// // const cloudinary = require('../config/cloudinary');

// // // ── 1. Storage សម្រាប់ រូបភាព (មានហើយ) ─────────────────
// // const imageStorage = new CloudinaryStorage({
// //   cloudinary: cloudinary,
// //   params: {
// //     folder: 'exam_questions',
// //     allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
// //     transformation: [{ width: 800, height: 600, crop: 'limit' }]
// //   }
// // });

// // // ── 2. Storage សម្រាប់ ឯកសារ PDF/Word/Excel (ថ្មី) ───────
// // const documentStorage = new CloudinaryStorage({
// //   cloudinary: cloudinary,
// //   params: async (req, file) => {
// //     return {
// //       folder: 'homework_submissions',
// //       resource_type: 'raw',
// //       public_id: `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`,
// //       format: undefined
// //     };
// //   }
// // });

// // // ── 3. File Filter សម្រាប់ ឯកសារ (ថ្មី) ─────────────────
// // const documentFilter = (req, file, cb) => {
// //   const allowedMimeTypes = [
// //     'application/pdf',
// //     'application/msword',
// //     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
// //     'application/vnd.ms-excel',
// //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
// //   ];

// //   if (allowedMimeTypes.includes(file.mimetype)) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error('រក្សាទុកបានតែ PDF, Word, Excel ប៉ុណ្ណោះ!'), false);
// //   }
// // };

// // // ── 4. Export ទាំងពីរ ────────────────────────────────────
// // const upload = multer({ storage: imageStorage });           // ចាស់ — រូបភាព

// // const uploadDocument = multer({                             // ថ្មី — ឯកសារ
// //   storage:    documentStorage,
// //   fileFilter: documentFilter,
// //   limits: { fileSize: 10 * 1024 * 1024 }                  // 10MB
// // });

// // module.exports = { upload, uploadDocument };


// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('../config/cloudinary');

// // ── 1. Storage សម្រាប់រូបភាព (exam questions) ────────────
// const imageStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'exam_questions',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
//     transformation: [{ width: 800, height: 600, crop: 'limit' }]
//   }
// });

// // ── 2. Storage សម្រាប់ PDF/Word/Excel (homework) ──────────
// const documentStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: async (req, file) => {
//     return {
//       folder:        'homework_submissions',
//       resource_type: 'raw',
//       access_mode:   'public',   // ✅ fix: allow public access
//       type:          'upload',   // ✅ fix: explicit public upload
//       public_id: `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`,
//       format: undefined
//     };
//   }
// });

// // ── 3. File Filter ────────────────────────────────────────
// const documentFilter = (req, file, cb) => {
//   const allowedMimeTypes = [
//     'application/pdf',
//     'application/msword',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'application/vnd.ms-excel',
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//   ];
//   if (allowedMimeTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('រក្សាទុកបានតែ PDF, Word, Excel ប៉ុណ្ណោះ!'), false);
//   }
// };

// // ── 4. Multer instances ───────────────────────────────────
// const upload         = multer({ storage: imageStorage });
// const uploadDocument = multer({
//   storage:    documentStorage,
//   fileFilter: documentFilter,
//   limits:     { fileSize: 10 * 1024 * 1024 }  // 10MB
// });

// // ── 5. Export ─────────────────────────────────────────────
// // ✅ default = upload → adminRoutes.js មិន break
// // ✅ named exports → teacherRoutes/studentRoutes ប្រើ uploadDocument
// module.exports                    = upload;
// module.exports.upload             = upload;
// module.exports.uploadDocument     = uploadDocument;

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// ── Image Storage ─────────────────────────────────────────
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'exam_questions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  }
});

// ── Document Filter ───────────────────────────────────────
const documentFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('រក្សាទុកបានតែ PDF, Word, Excel ប៉ុណ្ណោះ!'), false);
};

// ── Memory Storage សម្រាប់ Document ──────────────────────
const uploadDocumentMem = multer({
  storage: multer.memoryStorage(),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ── Upload ទៅ Cloudinary ដោយ Manual ──────────────────────
const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:        'homework_submissions',
          resource_type: 'raw',
          type:          'upload',
          access_mode:   'public',
          public_id:     `${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      const readable = new Readable();
      readable.push(req.file.buffer);
      readable.push(null);
      readable.pipe(stream);
    });

    req.file.path     = result.secure_url;   // ✅ URL សម្រាប់ save ទៅ DB
    req.file.filename = result.public_id;
    next();
  } catch (err) {
    next(err);
  }
};

// ── Exports ───────────────────────────────────────────────
const upload = multer({ storage: imageStorage });

module.exports                = upload;
module.exports.upload         = upload;

// ✅ uploadDocument = array of 2 middleware
module.exports.uploadDocument = [
  uploadDocumentMem.single('file'),
  uploadToCloudinary
];