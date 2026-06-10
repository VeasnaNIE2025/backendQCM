// // backend/routes/adminRoutes.js
// const express = require('express');
// const { protect, admin } = require('../middleware/authMiddleware');
// const {
//   getUsers, getUserById, createUser, updateUser, deleteUser
// } = require('../controllers/userController');
// const {
//   getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject
// } = require('../controllers/subjectController');
// const {
//   getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion
// } = require('../controllers/questionController');
// const {
//   getExams, getExamById, createExam, updateExam, deleteExam
// } = require('../controllers/examController');
// const {
//   getStatistics,
//   getExamResultsReport,
//   getStudentPerformance,
//   getSubjectPerformance,
//   getExamAnalytics,
//   getTopStudents,
//   getRecentActivities
// } = require('../controllers/reportController');
// const {
//   exportExamResults,
//   exportStudentPerformance,
//   exportSubjectPerformance
// } = require('../controllers/exportController');

// const router = express.Router();

// // -----------------------------
// //  Cloudinary image upload (public)
// // -----------------------------
// const upload = require('../middleware/upload');
// router.post('/upload-image', (req, res, next) => {
//   upload.single('image')(req, res, (err) => {
//     if (err) {
//       console.error('Upload error:', err);
//       return res.status(400).json({ 
//         message: err.message || 'Upload failed'
//       });
//     }
//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }
//     res.json({ imageUrl: req.file.path });
//   });
// });

// const {
//   getSubjectsByClass,
//   assignSubjectsToClass,
//   getAllClassesWithSubjects
// } = require('../controllers/classSubjectController');


// const { getClassStatistics, ... } = require('../controllers/reportController');
// router.get('/reports/class-statistics', getClassStatistics); // ✅ បន្ថែម

// router.use(protect, admin);

// // ... ខាងក្នុង router (បន្ទាប់ពី `router.use(protect, admin)`)
// router.get('/classes-subjects', getAllClassesWithSubjects);
// router.get('/classes/:classId/subjects', getSubjectsByClass);
// router.put('/classes/:classId/subjects', assignSubjectsToClass);

// router.get('/users', getUsers);
// router.get('/users/:id', getUserById);
// router.post('/users', createUser);
// router.put('/users/:id', updateUser);
// router.delete('/users/:id', deleteUser);

// // Subject routes
// router.get('/subjects', getSubjects);
// router.get('/subjects/:id', getSubjectById);
// router.post('/subjects', createSubject);
// router.put('/subjects/:id', updateSubject);
// router.delete('/subjects/:id', deleteSubject);

// // Question routes
// router.get('/questions', getQuestions);
// router.get('/questions/:id', getQuestionById);
// router.post('/questions', createQuestion);
// router.put('/questions/:id', updateQuestion);
// router.delete('/questions/:id', deleteQuestion);

// // Exam routes
// router.get('/exams', getExams);
// router.get('/exams/:id', getExamById);
// router.post('/exams', createExam);
// router.put('/exams/:id', updateExam);
// router.delete('/exams/:id', deleteExam);

// // Report routes
// router.get('/reports/statistics', getStatistics);
// router.get('/reports/exam-results', getExamResultsReport);
// router.get('/reports/student-performance', getStudentPerformance);
// router.get('/reports/subject-performance', getSubjectPerformance);
// router.get('/reports/exam-analytics', getExamAnalytics);
// router.get('/reports/top-students', getTopStudents);
// router.get('/reports/recent-activities', getRecentActivities);

// // Export routes (Excel)
// router.get('/export/exam-results', exportExamResults);
// router.get('/export/student-performance', exportStudentPerformance);
// router.get('/export/subject-performance', exportSubjectPerformance);




// module.exports = router;



// backend/routes/adminRoutes.js
const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');

// ── Controllers ────────────────────────────────────────────────
const {
  getUsers, getUserById, createUser, updateUser, deleteUser,
  downloadUserTemplate,      // ✅ បន្ថែម
  importUsersFromExcel       // ✅ បន្ថែម
} = require('../controllers/userController');

const {
  getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject
} = require('../controllers/subjectController');

const {
  getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion
} = require('../controllers/questionController');

const {
  getExams, getExamById, createExam, updateExam, deleteExam
} = require('../controllers/examController');

const {
  getStatistics,
  getClassStatistics,
  getExamResultsReport,
  getStudentPerformance,
  getSubjectPerformance,
  getExamAnalytics,
  getTopStudents,
  getRecentActivities
} = require('../controllers/reportController');

const {
  exportExamResults,
  exportStudentPerformance,
  exportSubjectPerformance,
  exportExamResultPDF
} = require('../controllers/exportController');

const {
  getSubjectsByClass,
  assignSubjectsToClass,
  getAllClassesWithSubjects
} = require('../controllers/classSubjectController');

// ── Multer (for image upload) ──────────────────────────────────
const imageUpload = require('../middleware/upload');   // rename to avoid conflict

// ── Multer (for Excel import) ─────────────────────────────────
const multer = require('multer');
const excelUpload = multer({ storage: multer.memoryStorage() }); // different name

const router = express.Router();

// ── Image Upload (no auth required) ───────────────────────────
router.post('/upload-image', (req, res) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ imageUrl: req.file.path });
  });
});

// ── Auth middleware (all routes below require admin) ──────────
router.use(protect, admin);

// ── Class-Subject routes ──────────────────────────────────────
router.get('/classes-subjects',            getAllClassesWithSubjects);
router.get('/classes/:classId/subjects',   getSubjectsByClass);
router.put('/classes/:classId/subjects',   assignSubjectsToClass);

// ── User routes ───────────────────────────────────────────────
router.get('/users',      getUsers);
router.get('/users/:id',  getUserById);
router.post('/users',     createUser);
router.put('/users/:id',  updateUser);
router.delete('/users/:id', deleteUser);

// ✅ Import/Export users (Excel)
router.get('/users/template', downloadUserTemplate);
router.post('/users/import', excelUpload.single('file'), importUsersFromExcel);

// ── Subject routes ────────────────────────────────────────────
router.get('/subjects',      getSubjects);
router.get('/subjects/:id',  getSubjectById);
router.post('/subjects',     createSubject);
router.put('/subjects/:id',  updateSubject);
router.delete('/subjects/:id', deleteSubject);

// ── Question routes ───────────────────────────────────────────
router.get('/questions',      getQuestions);
router.get('/questions/:id',  getQuestionById);
router.post('/questions',     createQuestion);
router.put('/questions/:id',  updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// ── Exam routes ───────────────────────────────────────────────
router.get('/exams',      getExams);
router.get('/exams/:id',  getExamById);
router.post('/exams',     createExam);
router.put('/exams/:id',  updateExam);
router.delete('/exams/:id', deleteExam);

// ── Report routes ─────────────────────────────────────────────
router.get('/reports/statistics',          getStatistics);
router.get('/reports/class-statistics',    getClassStatistics);
router.get('/reports/exam-results',        getExamResultsReport);
router.get('/reports/student-performance', getStudentPerformance);
router.get('/reports/subject-performance', getSubjectPerformance);
router.get('/reports/exam-analytics',      getExamAnalytics);
router.get('/reports/top-students',        getTopStudents);
router.get('/reports/recent-activities',   getRecentActivities);

// ── Export routes (Excel & PDF) ───────────────────────────────
router.get('/export/exam-results',         exportExamResults);
router.get('/export/student-performance',  exportStudentPerformance);
router.get('/export/subject-performance',  exportSubjectPerformance);
router.get('/export/result/:resultId/pdf', exportExamResultPDF);

module.exports = router;