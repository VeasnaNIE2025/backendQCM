const { sequelize } = require('../config/db');

// Get overall statistics
const getStatistics = async (req, res) => {
  try {
    const totalStudents = await sequelize.query(
      `SELECT COUNT(*) as count FROM users WHERE role = 'student'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const totalTeachers = await sequelize.query(
      `SELECT COUNT(*) as count FROM users WHERE role = 'teacher'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const totalSubjects = await sequelize.query(
      `SELECT COUNT(*) as count FROM subjects WHERE isActive = 1`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const totalQuestions = await sequelize.query(
      `SELECT COUNT(*) as count FROM questions`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const totalExams = await sequelize.query(
      `SELECT COUNT(*) as count FROM exams`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const totalCompletedExams = await sequelize.query(
      `SELECT COUNT(*) as count FROM exam_results WHERE status = 'completed'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const avgScore = await sequelize.query(
      `SELECT AVG(percentage) as average FROM exam_results WHERE status = 'completed'`,
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      totalStudents:      totalStudents[0]?.count      || 0,
      totalTeachers:      totalTeachers[0]?.count      || 0,
      totalSubjects:      totalSubjects[0]?.count      || 0,
      totalQuestions:     totalQuestions[0]?.count     || 0,
      totalExams:         totalExams[0]?.count         || 0,
      totalCompletedExams:totalCompletedExams[0]?.count|| 0,
      averageScore: parseFloat(avgScore[0]?.average || 0).toFixed(2)
    });
  } catch (error) {
    console.error('Error in getStatistics:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get exam results report ✅ + className
const getExamResultsReport = async (req, res) => {
  try {
    const { examId } = req.query;
    let whereClause = '';
    let replacements = {};

    if (examId) {
      whereClause = 'WHERE er.examId = :examId';
      replacements.examId = examId;
    }

    const results = await sequelize.query(
      `SELECT er.*,
              u.fullName   as studentName,
              u.email      as studentEmail,
              c.name       as className,
              e.title      as examTitle,
              e.totalPoints
       FROM exam_results er
       JOIN users u   ON er.studentId = u.id
       LEFT JOIN classes c ON u.classId = c.id
       JOIN exams e   ON er.examId = e.id
       ${whereClause}
       ORDER BY er.submittedAt DESC`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    res.json(results);
  } catch (error) {
    console.error('Error in getExamResultsReport:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get student performance ✅ + className
const getStudentPerformance = async (req, res) => {
  try {
    const results = await sequelize.query(
      `SELECT u.id, u.fullName, u.email,
              c.name              as className,
              COUNT(er.id)        as totalExamsTaken,
              SUM(er.totalScore)  as totalScore,
              SUM(e.totalPoints)  as totalPossible,
              AVG(er.percentage)  as averagePercentage
       FROM users u
       LEFT JOIN classes c      ON u.classId = c.id
       LEFT JOIN exam_results er ON u.id = er.studentId AND er.status = 'completed'
       LEFT JOIN exams e         ON er.examId = e.id
       WHERE u.role = 'student'
       GROUP BY u.id, u.fullName, u.email, c.name
       ORDER BY averagePercentage DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json(results);
  } catch (error) {
    console.error('Error in getStudentPerformance:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get subject-wise performance
const getSubjectPerformance = async (req, res) => {
  try {
    const results = await sequelize.query(
      `SELECT s.id, s.name as subjectName,
              COUNT(DISTINCT er.id)        as totalExams,
              COUNT(DISTINCT er.studentId) as totalStudents,
              AVG(er.percentage)           as averageScore
       FROM subjects s
       LEFT JOIN exams e         ON s.id = e.subjectId
       LEFT JOIN exam_results er ON e.id = er.examId AND er.status = 'completed'
       GROUP BY s.id, s.name
       ORDER BY averageScore DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json(results);
  } catch (error) {
    console.error('Error in getSubjectPerformance:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get exam analytics
const getExamAnalytics = async (req, res) => {
  try {
    const analytics = await sequelize.query(
      `SELECT e.id, e.title,
              COUNT(er.id) as totalAttempts,
              SUM(CASE WHEN er.percentage >= 70 THEN 1 ELSE 0 END) as passed,
              SUM(CASE WHEN er.percentage < 70 AND er.percentage >= 50 THEN 1 ELSE 0 END) as average,
              SUM(CASE WHEN er.percentage < 50 THEN 1 ELSE 0 END) as failed,
              AVG(er.percentage) as averageScore,
              MAX(er.percentage) as highestScore,
              MIN(er.percentage) as lowestScore
       FROM exams e
       LEFT JOIN exam_results er ON e.id = er.examId AND er.status = 'completed'
       GROUP BY e.id, e.title
       ORDER BY e.createdAt DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json(analytics);
  } catch (error) {
    console.error('Error in getExamAnalytics:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get top students ✅ + className
const getTopStudents = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const results = await sequelize.query(
      `SELECT u.id, u.fullName, u.email,
              c.name             as className,
              COUNT(er.id)       as examsTaken,
              AVG(er.percentage) as averageScore,
              MAX(er.percentage) as bestScore
       FROM users u
       LEFT JOIN classes c       ON u.classId = c.id
       JOIN exam_results er      ON u.id = er.studentId AND er.status = 'completed'
       WHERE u.role = 'student'
       GROUP BY u.id, u.fullName, u.email, c.name
       ORDER BY averageScore DESC
       LIMIT :limit`,
      { replacements: { limit: parseInt(limit) }, type: sequelize.QueryTypes.SELECT }
    );
    res.json(results);
  } catch (error) {
    console.error('Error in getTopStudents:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const activities = await sequelize.query(
      `SELECT 'exam_completed' as type, er.id, u.fullName as studentName,
              e.title as examTitle, er.percentage, er.submittedAt as createdAt
       FROM exam_results er
       JOIN users u ON er.studentId = u.id
       JOIN exams e ON er.examId = e.id
       WHERE er.status = 'completed'
       UNION ALL
       SELECT 'exam_created' as type, e.id, NULL as studentName,
              e.title as examTitle, NULL as percentage, e.createdAt
       FROM exams e
       ORDER BY createdAt DESC
       LIMIT 20`,
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json(activities);
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStatistics, getExamResultsReport, getStudentPerformance,
  getSubjectPerformance, getExamAnalytics, getTopStudents, getRecentActivities
};