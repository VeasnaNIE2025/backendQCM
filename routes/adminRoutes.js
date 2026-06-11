
// // backend/routes/adminRoutes.js
// const express = require('express');
// const { protect, admin } = require('../middleware/authMiddleware');

// // ── Controllers ────────────────────────────────────────────────
// const {
//   getUsers, getUserById, createUser, updateUser, deleteUser,
//   downloadUserTemplate,      
//   importUsersFromExcel      
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
//   getClassStatistics,
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
//   exportSubjectPerformance,
//   exportExamResultPDF
// } = require('../controllers/exportController');

// const {
//   getSubjectsByClass,
//   assignSubjectsToClass,
//   getAllClassesWithSubjects
// } = require('../controllers/classSubjectController');

// // ── Multer (for image upload) ──────────────────────────────────
// const imageUpload = require('../middleware/upload');   // rename to avoid conflict

// // ── Multer (for Excel import) ─────────────────────────────────
// const multer = require('multer');
// const excelUpload = multer({ storage: multer.memoryStorage() }); // different name

// const router = express.Router();

// // ── Image Upload (no auth required) ───────────────────────────
// router.post('/upload-image', (req, res) => {
//   imageUpload.single('image')(req, res, (err) => {
//     if (err) {
//       console.error('Upload error:', err);
//       return res.status(400).json({ message: err.message || 'Upload failed' });
//     }
//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }
//     res.json({ imageUrl: req.file.path });
//   });
// });

// // ── Auth middleware (all routes below require admin) ──────────
// router.use(protect, admin);

// // ── Class-Subject routes ──────────────────────────────────────
// router.get('/classes-subjects',            getAllClassesWithSubjects);
// router.get('/classes/:classId/subjects',   getSubjectsByClass);
// router.put('/classes/:classId/subjects',   assignSubjectsToClass);

// // ── User routes ───────────────────────────────────────────────
// router.get('/users',      getUsers);
// router.get('/users/:id',  getUserById);
// router.post('/users',     createUser);
// router.put('/users/:id',  updateUser);
// router.delete('/users/:id', deleteUser);

// // ✅ Import/Export users (Excel)
// router.get('/users/template', downloadUserTemplate);
// router.post('/users/import', excelUpload.single('file'), importUsersFromExcel);

// // ── Subject routes ────────────────────────────────────────────
// router.get('/subjects',      getSubjects);
// router.get('/subjects/:id',  getSubjectById);
// router.post('/subjects',     createSubject);
// router.put('/subjects/:id',  updateSubject);
// router.delete('/subjects/:id', deleteSubject);

// // ── Question routes ───────────────────────────────────────────
// router.get('/questions',      getQuestions);
// router.get('/questions/:id',  getQuestionById);
// router.post('/questions',     createQuestion);
// router.put('/questions/:id',  updateQuestion);
// router.delete('/questions/:id', deleteQuestion);

// // ── Exam routes ───────────────────────────────────────────────
// router.get('/exams',      getExams);
// router.get('/exams/:id',  getExamById);
// router.post('/exams',     createExam);
// router.put('/exams/:id',  updateExam);
// router.delete('/exams/:id', deleteExam);

// // ── Report routes ─────────────────────────────────────────────
// router.get('/reports/statistics',          getStatistics);
// router.get('/reports/class-statistics',    getClassStatistics);
// router.get('/reports/exam-results',        getExamResultsReport);
// router.get('/reports/student-performance', getStudentPerformance);
// router.get('/reports/subject-performance', getSubjectPerformance);
// router.get('/reports/exam-analytics',      getExamAnalytics);
// router.get('/reports/top-students',        getTopStudents);
// router.get('/reports/recent-activities',   getRecentActivities);

// // ── Export routes (Excel & PDF) ───────────────────────────────
// router.get('/export/exam-results',         exportExamResults);
// router.get('/export/student-performance',  exportStudentPerformance);
// router.get('/export/subject-performance',  exportSubjectPerformance);
// router.get('/export/result/:resultId/pdf', exportExamResultPDF);

// module.exports = router;


// backend/routes/adminRoutes.js
const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');

// ── Controllers ────────────────────────────────────────────────
const {
  getUsers, getUserById, createUser, updateUser, deleteUser,
  downloadUserTemplate,
  importUsersFromExcel
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
const imageUpload = require('../middleware/upload');

// ── Multer (for Excel import) ─────────────────────────────────
const multer = require('multer');
const excelUpload = multer({ storage: multer.memoryStorage() });

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
router.get('/classes-subjects',          getAllClassesWithSubjects);
router.get('/classes/:classId/subjects', getSubjectsByClass);
router.put('/classes/:classId/subjects', assignSubjectsToClass);

// ── User routes ───────────────────────────────────────────────
router.get('/users',          getUsers);
router.post('/users',         createUser);

// ✅ Static routes មុន dynamic /:id (fix 404 bug)
router.get('/users/template', downloadUserTemplate);
router.post('/users/import',  excelUpload.single('file'), importUsersFromExcel);

// ✅ Dynamic routes ក្រោយ
router.get('/users/:id',      getUserById);
router.put('/users/:id',      updateUser);
router.delete('/users/:id',   deleteUser);

// ── Subject routes ────────────────────────────────────────────
router.get('/subjects',       getSubjects);
router.post('/subjects',      createSubject);
router.get('/subjects/:id',   getSubjectById);
router.put('/subjects/:id',   updateSubject);
router.delete('/subjects/:id', deleteSubject);

// ── Question routes ───────────────────────────────────────────
router.get('/questions',       getQuestions);
router.post('/questions',      createQuestion);
router.get('/questions/:id',   getQuestionById);
router.put('/questions/:id',   updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// ── Exam routes ───────────────────────────────────────────────
router.get('/exams',       getExams);
router.post('/exams',      createExam);
router.get('/exams/:id',   getExamById);
router.put('/exams/:id',   updateExam);
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