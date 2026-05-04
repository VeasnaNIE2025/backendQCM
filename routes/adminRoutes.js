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

// const router = express.Router();

// // All routes require authentication and admin role
// router.use(protect, admin);

// // ==================== USER ROUTES ====================
// router.get('/users', getUsers);
// router.get('/users/:id', getUserById);
// router.post('/users', createUser);
// router.put('/users/:id', updateUser);
// router.delete('/users/:id', deleteUser);

// // ==================== SUBJECT ROUTES ====================
// router.get('/subjects', getSubjects);
// router.get('/subjects/:id', getSubjectById);
// router.post('/subjects', createSubject);
// router.put('/subjects/:id', updateSubject);
// router.delete('/subjects/:id', deleteSubject);

// // ==================== QUESTION ROUTES ====================
// router.get('/questions', getQuestions);
// router.get('/questions/:id', getQuestionById);
// router.post('/questions', createQuestion);
// router.put('/questions/:id', updateQuestion);
// router.delete('/questions/:id', deleteQuestion);

// module.exports = router;

const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getUsers, getUserById, createUser, updateUser, deleteUser
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
  exportSubjectPerformance
} = require('../controllers/exportController');


const router = express.Router();

// All routes require authentication and admin role
router.use(protect, admin);

// User routes
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Subject routes
router.get('/subjects', getSubjects);
router.get('/subjects/:id', getSubjectById);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// Question routes
router.get('/questions', getQuestions);
router.get('/questions/:id', getQuestionById);
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// Exam routes
router.get('/exams', getExams);
router.get('/exams/:id', getExamById);
router.post('/exams', createExam);
router.put('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);

router.get('/reports/statistics', getStatistics);
router.get('/reports/exam-results', getExamResultsReport);
router.get('/reports/student-performance', getStudentPerformance);
router.get('/reports/subject-performance', getSubjectPerformance);
router.get('/reports/exam-analytics', getExamAnalytics);
router.get('/reports/top-students', getTopStudents);
router.get('/reports/recent-activities', getRecentActivities);

// Export routes
router.get('/export/exam-results', exportExamResults);
router.get('/export/student-performance', exportStudentPerformance);
router.get('/export/subject-performance', exportSubjectPerformance);

module.exports = router;