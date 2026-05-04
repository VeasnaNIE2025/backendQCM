const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getMySubjects,
  getMyStats,
  getMyQuestions,
  createMyQuestion,
  updateMyQuestion,
  deleteMyQuestion,
  getMyReports
} = require('../controllers/teacherController');

const router = express.Router();

// All teacher routes require authentication
router.use(protect);

router.get('/subjects', getMySubjects);
router.get('/stats', getMyStats);
router.get('/questions', getMyQuestions);
router.post('/questions', createMyQuestion);
router.put('/questions/:id', updateMyQuestion);
router.delete('/questions/:id', deleteMyQuestion);
router.get('/reports', getMyReports);

module.exports = router;