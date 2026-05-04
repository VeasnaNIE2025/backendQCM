// const { sequelize } = require('../config/db');

// const getMySubjects = async (req, res) => {
//   try {
//     const teacherId = req.user.id;
//     const subjects = await sequelize.query(
//       `SELECT * FROM subjects WHERE teacherId = :teacherId AND isActive = 1`,
//       { replacements: { teacherId }, type: sequelize.QueryTypes.SELECT }
//     );
//     res.json(subjects);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = { getMySubjects };


const { sequelize } = require('../config/db');

// 1. Get subjects assigned to this teacher
const getMySubjects = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const subjects = await sequelize.query(
      `SELECT * FROM subjects WHERE teacherId = :teacherId AND isActive = 1`,
      { replacements: { teacherId }, type: sequelize.QueryTypes.SELECT }
    );
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Get statistics: total questions & total students (for teacher's subjects)
const getMyStats = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const [questionsResult] = await sequelize.query(
      `SELECT COUNT(q.id) as totalQuestions 
       FROM questions q 
       JOIN subjects s ON q.subjectId = s.id 
       WHERE s.teacherId = :teacherId`,
      { replacements: { teacherId }, type: sequelize.QueryTypes.SELECT }
    );
    const [studentsResult] = await sequelize.query(
      `SELECT COUNT(DISTINCT er.studentId) as totalStudents 
       FROM exam_results er 
       JOIN exams e ON er.examId = e.id 
       JOIN subjects s ON e.subjectId = s.id 
       WHERE s.teacherId = :teacherId AND er.status = 'completed'`,
      { replacements: { teacherId }, type: sequelize.QueryTypes.SELECT }
    );
    res.json({
      totalQuestions: questionsResult.totalQuestions || 0,
      totalStudents: studentsResult.totalStudents || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Get questions that belong to teacher's subjects
const getMyQuestions = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { subjectId, search } = req.query;
    let whereClause = `s.teacherId = :teacherId`;
    let replacements = { teacherId };
    if (subjectId) {
      whereClause += ` AND q.subjectId = :subjectId`;
      replacements.subjectId = subjectId;
    }
    if (search) {
      whereClause += ` AND q.questionText LIKE :search`;
      replacements.search = `%${search}%`;
    }
    const questions = await sequelize.query(
      `SELECT q.*, s.name as subjectName 
       FROM questions q 
       JOIN subjects s ON q.subjectId = s.id 
       WHERE ${whereClause}
       ORDER BY q.createdAt DESC`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Create a new question (must belong to one of teacher's subjects)
const createMyQuestion = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { subjectId, questionText, option_a, option_b, option_c, option_d, correctAnswer, explanation, difficulty, points } = req.body;
    // Verify the subject belongs to this teacher
    const [subject] = await sequelize.query(
      `SELECT id FROM subjects WHERE id = :subjectId AND teacherId = :teacherId`,
      { replacements: { subjectId, teacherId }, type: sequelize.QueryTypes.SELECT }
    );
    if (!subject) {
      return res.status(403).json({ message: 'អ្នកមិនមានសិទ្ធិបន្ថែមសំណួរទៅមុខវិជ្ជានេះទេ' });
    }
    const result = await sequelize.query(
      `INSERT INTO questions (subjectId, questionText, option_a, option_b, option_c, option_d, correctAnswer, explanation, difficulty, points) 
       VALUES (:subjectId, :questionText, :option_a, :option_b, :option_c, :option_d, :correctAnswer, :explanation, :difficulty, :points)`,
      {
        replacements: { subjectId, questionText, option_a, option_b, option_c, option_d, correctAnswer, explanation: explanation || '', difficulty: difficulty || 'medium', points: points || 1 },
        type: sequelize.QueryTypes.INSERT
      }
    );
    res.status(201).json({ id: result[0], message: 'បង្កើតសំណួរបានជោគជ័យ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Update a question (only if it belongs to teacher's subjects)
const updateMyQuestion = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const questionId = req.params.id;
    const { questionText, option_a, option_b, option_c, option_d, correctAnswer, explanation, difficulty, points } = req.body;
    // Check ownership via subject
    const [check] = await sequelize.query(
      `SELECT q.id FROM questions q JOIN subjects s ON q.subjectId = s.id WHERE q.id = :questionId AND s.teacherId = :teacherId`,
      { replacements: { questionId, teacherId }, type: sequelize.QueryTypes.SELECT }
    );
    if (!check) {
      return res.status(403).json({ message: 'អ្នកមិនមានសិទ្ធិកែប្រែសំណួរនេះទេ' });
    }
    await sequelize.query(
      `UPDATE questions SET 
        questionText = COALESCE(:questionText, questionText),
        option_a = COALESCE(:option_a, option_a),
        option_b = COALESCE(:option_b, option_b),
        option_c = COALESCE(:option_c, option_c),
        option_d = COALESCE(:option_d, option_d),
        correctAnswer = COALESCE(:correctAnswer, correctAnswer),
        explanation = COALESCE(:explanation, explanation),
        difficulty = COALESCE(:difficulty, difficulty),
        points = COALESCE(:points, points)
       WHERE id = :questionId`,
      {
        replacements: { questionId, questionText, option_a, option_b, option_c, option_d, correctAnswer, explanation, difficulty, points },
        type: sequelize.QueryTypes.UPDATE
      }
    );
    res.json({ message: 'កែប្រែសំណួរបានជោគជ័យ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Delete a question (only if belongs to teacher's subjects)
const deleteMyQuestion = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const questionId = req.params.id;
    const [check] = await sequelize.query(
      `SELECT q.id FROM questions q JOIN subjects s ON q.subjectId = s.id WHERE q.id = :questionId AND s.teacherId = :teacherId`,
      { replacements: { questionId, teacherId }, type: sequelize.QueryTypes.SELECT }
    );
    if (!check) {
      return res.status(403).json({ message: 'អ្នកមិនមានសិទ្ធិលុបសំណួរនេះទេ' });
    }
    await sequelize.query(`DELETE FROM questions WHERE id = :questionId`, { replacements: { questionId }, type: sequelize.QueryTypes.DELETE });
    res.json({ message: 'លុបសំណួរបានជោគជ័យ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Get reports (exam results for teacher's subjects)
const getMyReports = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const results = await sequelize.query(
      `SELECT er.*, u.fullName as studentName, u.email as studentEmail, e.title as examTitle, e.totalPoints, s.name as subjectName
       FROM exam_results er
       JOIN exams e ON er.examId = e.id
       JOIN subjects s ON e.subjectId = s.id
       JOIN users u ON er.studentId = u.id
       WHERE s.teacherId = :teacherId AND er.status = 'completed'
       ORDER BY er.submittedAt DESC`,
      { replacements: { teacherId }, type: sequelize.QueryTypes.SELECT }
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMySubjects,
  getMyStats,
  getMyQuestions,
  createMyQuestion,
  updateMyQuestion,
  deleteMyQuestion,
  getMyReports
};