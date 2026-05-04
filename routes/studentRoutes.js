const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getAvailableExams,
  getExamDetails,
  submitExam,
  getMyResults
} = require('../controllers/studentExamController');

const router = express.Router();

// Protect all student routes
router.use(protect);

// Exam routes
router.get('/exams', getAvailableExams);
router.get('/exams/:id', getExamDetails);
router.post('/exams/:id/submit', submitExam);
router.get('/results', getMyResults);

module.exports = router;