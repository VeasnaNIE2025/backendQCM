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
  getMyReports,
  getMyClasses
} = require('../controllers/teacherController');

// ── Controllers ថ្មី ─────────────────────────────────────
const {
  createAssignment,
  getAssignmentsBySubject,
  getSubmissionsByAssignment,
  gradeSubmission,
  updateAssignment,
  deleteAssignment
} = require('../controllers/assignmentController');

router.use(protect);

// ════════════════════════════════════════════════
// Routes ចាស់
// ════════════════════════════════════════════════
router.get('/subjects',                         getMySubjects);
router.get('/stats',                            getMyStats);
router.get('/questions',                        getMyQuestions);
router.post('/questions',                       upload.single('image'), createMyQuestion);
router.put('/questions/:id',                    upload.single('image'), updateMyQuestion);
router.delete('/questions/:id',                 deleteMyQuestion);
router.get('/reports',                          getMyReports);
router.get('/classes',                          getMyClasses);

// ════════════════════════════════════════════════
// Routes ថ្មី — Assignment
// ════════════════════════════════════════════════
router.get('/assignments',                      getAssignmentsBySubject);
router.post('/assignments',                     upload.none(), createAssignment);
router.put('/assignments/:id',                  updateAssignment);
router.delete('/assignments/:id',               deleteAssignment);
router.get('/assignments/:subjectId',           getAssignmentsBySubject);
router.get('/submissions/:assignmentId',        getSubmissionsByAssignment);
router.put('/submissions/:submissionId/grade',  gradeSubmission);

module.exports = router;