const { sequelize } = require('../config/db');

const getStatistics = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalSubjects, totalQuestions,
           totalExams, totalCompletedExams, avgScore] = await Promise.all([
      sequelize.query(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count FROM users WHERE role = 'teacher'`, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count FROM subjects WHERE isActive = 1`, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count FROM questions`, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count FROM exams`, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT COUNT(*) as count FROM exam_results WHERE status = 'completed'`, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`SELECT AVG(percentage) as average FROM exam_results WHERE status = 'completed'`, { type: sequelize.QueryTypes.SELECT })
    ]);
    res.json({
      totalStudents:       totalStudents[0]?.count       || 0,
      totalTeachers:       totalTeachers[0]?.count       || 0,
      totalSubjects:       totalSubjects[0]?.count       || 0,
      totalQuestions:      totalQuestions[0]?.count      || 0,
      totalExams:          totalExams[0]?.count          || 0,
      totalCompletedExams: totalCompletedExams[0]?.count || 0,
      averageScore: parseFloat(avgScore[0]?.average || 0).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Class Statistics (NEW) ──────────────────────────────────────
const getClassStatistics = async (req, res) => {
  try {
    // ១. សិស្សនៅថ្នាក់នីមួយៗ
    const studentStats = await sequelize.query(
      `SELECT c.id AS classId, c.name AS className, COUNT(u.id) AS totalStudents
       FROM classes c
       LEFT JOIN users u ON u.classId = c.id AND u.role = 'student'
       GROUP BY c.id, c.name
       ORDER BY c.name ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // ២. Subjects/Course តាមថ្នាក់
    const subjectStats = await sequelize.query(
      `SELECT cs.classId,
              GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR ', ') AS subjects
       FROM class_subjects cs
       JOIN subjects s ON cs.subjectId = s.id
       GROUP BY cs.classId`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // ៣. លទ្ធផលប្រឡងតាមថ្នាក់
    const examStats = await sequelize.query(
      `SELECT
         u.classId,
         COUNT(DISTINCT er.id)                                     AS totalExams,
         COUNT(DISTINCT er.studentId)                              AS studentsExamined,
         SUM(CASE WHEN er.percentage >= 70 THEN 1 ELSE 0 END)     AS passed,
         SUM(CASE WHEN er.percentage >= 50
                   AND er.percentage < 70 THEN 1 ELSE 0 END)      AS average,
         SUM(CASE WHEN er.percentage < 50 THEN 1 ELSE 0 END)      AS failed,
         ROUND(AVG(er.percentage), 1)                              AS avgScore
       FROM exam_results er
       JOIN users u ON er.studentId = u.id
       WHERE er.status = 'completed' AND u.classId IS NOT NULL
       GROUP BY u.classId`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // ៤. ការប្រឡងខាងមុខ/បច្ចុប្បន្ន តាមថ្នាក់
    const upcomingExams = await sequelize.query(
      `SELECT cs.classId, e.title, e.startDate, e.endDate, s.name AS subjectName
       FROM exams e
       JOIN subjects s        ON e.subjectId = s.id
       JOIN class_subjects cs ON cs.subjectId = s.id
       WHERE e.isActive = 1 AND e.endDate >= NOW()
       ORDER BY e.startDate ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // Merge
    const result = studentStats.map(cls => {
      const subj  = subjectStats.find(x => x.classId === cls.classId) || {};
      const exam  = examStats.find(x => x.classId === cls.classId)    || {};
      const exams = upcomingExams.filter(x => x.classId === cls.classId);
      return {
        classId:          cls.classId,
        className:        cls.className,
        totalStudents:    parseInt(cls.totalStudents)     || 0,
        subjects:         subj.subjects                  || '—',
        totalExams:       parseInt(exam.totalExams)       || 0,
        studentsExamined: parseInt(exam.studentsExamined) || 0,
        passed:           parseInt(exam.passed)           || 0,
        average:          parseInt(exam.average)          || 0,
        failed:           parseInt(exam.failed)           || 0,
        avgScore:         parseFloat(exam.avgScore)       || 0,
        upcomingExams:    exams
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getClassStatistics:', error);
    res.status(500).json({ message: error.message });
  }
};

const getExamResultsReport = async (req, res) => {
  try {
    const { examId } = req.query;
    let whereClause = '';
    let replacements = {};
    if (examId) { whereClause = 'WHERE er.examId = :examId'; replacements.examId = examId; }
    const results = await sequelize.query(
      `SELECT er.*, u.fullName as studentName, u.email as studentEmail,
              c.name as className, e.title as examTitle, e.totalPoints
       FROM exam_results er
       JOIN users u ON er.studentId = u.id
       LEFT JOIN classes c ON u.classId = c.id
       JOIN exams e ON er.examId = e.id
       ${whereClause}
       ORDER BY er.submittedAt DESC`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentPerformance = async (req, res) => {
  try {
    const results = await sequelize.query(
      `SELECT u.id, u.fullName, u.email, c.name as className,
              COUNT(er.id) as totalExamsTaken,
              SUM(er.totalScore) as totalScore,
              SUM(e.totalPoints) as totalPossible,
              AVG(er.percentage) as averagePercentage
       FROM users u
       LEFT JOIN classes c ON u.classId = c.id
       LEFT JOIN exam_results er ON u.id = er.studentId AND er.status = 'completed'
       LEFT JOIN exams e ON er.examId = e.id
       WHERE u.role = 'student'
       GROUP BY u.id, u.fullName, u.email, c.name
       ORDER BY averagePercentage DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubjectPerformance = async (req, res) => {
  try {
    const results = await sequelize.query(
      `SELECT s.id, s.name as subjectName,
              COUNT(DISTINCT er.id) as totalExams,
              COUNT(DISTINCT er.studentId) as totalStudents,
              AVG(er.percentage) as averageScore
       FROM subjects s
       LEFT JOIN exams e ON s.id = e.subjectId
       LEFT JOIN exam_results er ON e.id = er.examId AND er.status = 'completed'
       GROUP BY s.id, s.name
       ORDER BY averageScore DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
    res.status(500).json({ message: error.message });
  }
};

const getTopStudents = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const results = await sequelize.query(
      `SELECT u.id, u.fullName, u.email, c.name as className,
              COUNT(er.id) as examsTaken,
              AVG(er.percentage) as averageScore,
              MAX(er.percentage) as bestScore
       FROM users u
       LEFT JOIN classes c ON u.classId = c.id
       JOIN exam_results er ON u.id = er.studentId AND er.status = 'completed'
       WHERE u.role = 'student'
       GROUP BY u.id, u.fullName, u.email, c.name
       ORDER BY averageScore DESC
       LIMIT :limit`,
      { replacements: { limit: parseInt(limit) }, type: sequelize.QueryTypes.SELECT }
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStatistics, getClassStatistics,
  getExamResultsReport, getStudentPerformance, getSubjectPerformance,
  getExamAnalytics, getTopStudents, getRecentActivities
};