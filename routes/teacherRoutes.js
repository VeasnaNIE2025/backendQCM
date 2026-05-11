// // 

// const express = require('express');
// const router = express.Router();
// const { protect } = require('../middleware/authMiddleware');
// const {
//   getMySubjects,
//   getMyStats,
//   getMyQuestions,
//   createMyQuestion,
//   updateMyQuestion,
//   deleteMyQuestion,
//   getMyReports
// } = require('../controllers/teacherController');

// router.use(protect);

// router.get('/subjects', getMySubjects);
// router.get('/stats', getMyStats);
// router.get('/questions', getMyQuestions);
// router.post('/questions', createMyQuestion);
// router.put('/questions/:id', updateMyQuestion);
// router.delete('/questions/:id', deleteMyQuestion);
// router.get('/reports', getMyReports);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload, uploadDocument } = require('../middleware/upload');

// ── Controllers ចាស់ ─────────────────────────────────────
const {
  getMySubjects,
  getMyStats,
  getMyQuestions,
  createMyQuestion,
  updateMyQuestion,
  deleteMyQuestion,
  getMyReports
} = require('../controllers/teacherController');

// ── Controllers ថ្មី ─────────────────────────────────────
const {
  createAssignment,
  getAssignmentsBySubject,
  getSubmissionsByAssignment,
  gradeSubmission
} = require('../controllers/assignmentController');

router.use(protect);

// ════════════════════════════════════════════════
// Routes ចាស់ (មិនផ្លាស់អ្វីសោះ)
// ════════════════════════════════════════════════
router.get('/subjects',           getMySubjects);
router.get('/stats',              getMyStats);
router.get('/questions',          getMyQuestions);
router.post('/questions',         upload.single('image'), createMyQuestion);
router.put('/questions/:id',      upload.single('image'), updateMyQuestion);
router.delete('/questions/:id',   deleteMyQuestion);
router.get('/reports',            getMyReports);

// ════════════════════════════════════════════════
// Routes ថ្មី — Assignment
// ════════════════════════════════════════════════
router.post('/assignments',                       upload.none(), createAssignment);
router.get('/assignments/:subjectId',             getAssignmentsBySubject);
router.get('/submissions/:assignmentId',          getSubmissionsByAssignment);
router.put('/submissions/:submissionId/grade',    gradeSubmission);

module.exports = router;