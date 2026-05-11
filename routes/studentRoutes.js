// const express = require('express');
// const { protect } = require('../middleware/authMiddleware');
// const {
//   getAvailableExams,
//   getExamDetails,
//   submitExam,
//   getMyResults
// } = require('../controllers/studentExamController');

// const router = express.Router();

// // Protect all student routes
// router.use(protect);

// // Exam routes
// router.get('/exams', getAvailableExams);
// router.get('/exams/:id', getExamDetails);
// router.post('/exams/:id/submit', submitExam);
// router.get('/results', getMyResults);

// module.exports = router;
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadDocument } = require('../middleware/upload');

// ── Controllers ចាស់ ─────────────────────────────────────
const {
  getAvailableExams,
  getExamDetails,
  submitExam,
  getMyResults
} = require('../controllers/studentExamController');

// ── Controllers ថ្មី ─────────────────────────────────────
const {
  getStudentAssignments,
  submitAssignment,
  getMySubmissions
} = require('../controllers/assignmentController');

// Protect all student routes
router.use(protect);

// ════════════════════════════════════════════════
// Routes ចាស់ (មិនផ្លាស់អ្វីសោះ)
// ════════════════════════════════════════════════
router.get('/exams',              getAvailableExams);
router.get('/exams/:id',          getExamDetails);
router.post('/exams/:id/submit',  submitExam);
router.get('/results',            getMyResults);

// ════════════════════════════════════════════════
// Routes ថ្មី — Assignment
// ════════════════════════════════════════════════
router.get('/assignments',                              getStudentAssignments);
router.post('/assignments/:assignmentId/submit',        uploadDocument.single('file'), submitAssignment);
router.get('/my-submissions',                           getMySubmissions);

module.exports = router;