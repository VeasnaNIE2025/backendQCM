const { sequelize } = require('../config/db');

// ✅ Helper: Parse DB date string as UTC
const parseUTC = (str) => {
  if (!str) return null;
  if (str instanceof Date) return str;
  const s = str.toString().trim();
  return new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
};

// Get available exams for student
const getAvailableExams = async (req, res) => {
  try {
    const studentId = req.user.id;
    // Get student's classId
    const student = await User.findByPk(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const classId = student.classId;

    const now = new Date();
    const nowUTC = now.toISOString().slice(0, 19).replace('T', ' ');

    const exams = await sequelize.query(
      `SELECT e.*, s.name as subjectName 
       FROM exams e 
       JOIN subjects s ON e.subjectId = s.id
       JOIN class_subjects cs ON cs.subjectId = s.id
       WHERE cs.classId = :classId
       AND e.isActive = 1 
       AND e.endDate >= :now
       ORDER BY e.startDate ASC`,
      {
        replacements: { classId, now: nowUTC },
        type: sequelize.QueryTypes.SELECT
      }
    );
    res.json(exams);
  } catch (error) {
    console.error('Error in getAvailableExams:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get exam details with random questions per student
const getExamDetails = async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;

    const exam = await sequelize.query(
      `SELECT e.*, s.name as subjectName 
       FROM exams e 
       LEFT JOIN subjects s ON e.subjectId = s.id 
       WHERE e.id = :examId`,
      {
        replacements: { examId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!exam || exam.length === 0) {
      return res.status(404).json({ message: 'មិនឃើញការប្រឡង' });
    }

    const examData = exam[0];
    const isRandomMode = examData.numberOfQuestions && examData.numberOfQuestions > 0;

    const now = new Date();
    const startDate = parseUTC(examData.startDate);
    const endDate = parseUTC(examData.endDate);

    if (now < startDate) {
      return res.status(400).json({ message: 'ការប្រឡងមិនទាន់ចាប់ផ្តើម' });
    }
    if (now > endDate) {
      return res.status(400).json({ message: 'ការប្រឡងបានបញ្ចប់ហើយ' });
    }

    const existingResult = await sequelize.query(
      `SELECT * FROM exam_results WHERE examId = :examId AND studentId = :studentId AND status = 'completed'`,
      {
        replacements: { examId, studentId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existingResult.length > 0) {
      return res.status(400).json({ message: 'អ្នកបានធ្វើការប្រឡងនេះរួចហើយ' });
    }

    let studentQuestions = await sequelize.query(
      `SELECT * FROM student_exam_questions WHERE examId = :examId AND studentId = :studentId`,
      {
        replacements: { examId, studentId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    let questions = [];

    if (studentQuestions.length === 0) {
      if (isRandomMode) {
        // Random mode: pick from exam_questions pool
        const availableQuestions = await sequelize.query(
          `SELECT q.* FROM exam_questions eq
           LEFT JOIN questions q ON eq.questionId = q.id
           WHERE eq.examId = :examId
           ORDER BY RAND()
           LIMIT :limit`,
          {
            replacements: { examId, limit: examData.numberOfQuestions },
            type: sequelize.QueryTypes.SELECT
          }
        );

        for (let i = 0; i < availableQuestions.length; i++) {
          await sequelize.query(
            `INSERT INTO student_exam_questions (examId, studentId, questionId, \`order\`) 
             VALUES (:examId, :studentId, :questionId, :order)`,
            {
              replacements: { examId, studentId, questionId: availableQuestions[i].id, order: i },
              type: sequelize.QueryTypes.INSERT
            }
          );
        }

        questions = availableQuestions.map(q => ({ ...q, points: 1 }));
      } else {
        // ✅ FIX: Manual mode — insert into student_exam_questions ផង
        // ដើម្បីឱ្យ submitExam រក questions បានត្រឹមត្រូវ
        const manualQuestions = await sequelize.query(
          `SELECT q.*, eq.\`order\`
           FROM exam_questions eq 
           LEFT JOIN questions q ON eq.questionId = q.id 
           WHERE eq.examId = :examId 
           ORDER BY eq.\`order\` ASC`,
          {
            replacements: { examId },
            type: sequelize.QueryTypes.SELECT
          }
        );

        for (let i = 0; i < manualQuestions.length; i++) {
          await sequelize.query(
            `INSERT INTO student_exam_questions (examId, studentId, questionId, \`order\`) 
             VALUES (:examId, :studentId, :questionId, :order)`,
            {
              replacements: { examId, studentId, questionId: manualQuestions[i].id, order: i },
              type: sequelize.QueryTypes.INSERT
            }
          );
        }

        questions = manualQuestions;
      }
    } else {
      questions = await sequelize.query(
        `SELECT q.*, seq.\`order\`
         FROM student_exam_questions seq 
         LEFT JOIN questions q ON seq.questionId = q.id 
         WHERE seq.examId = :examId AND seq.studentId = :studentId 
         ORDER BY seq.\`order\` ASC`,
        {
          replacements: { examId, studentId },
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (isRandomMode) {
        questions = questions.map(q => ({ ...q, points: 1 }));
      }
    }

    res.json({ ...examData, Questions: questions });
  } catch (error) {
    console.error('Error in getExamDetails:', error);
    res.status(500).json({ message: error.message });
  }
};

// Submit exam
const submitExam = async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;

    // ✅ FIX: Support both Array និង Object format សម្រាប់ answers
    // Frontend (TakeExam.jsx) send: Object.values(answers) → Array ['a', 'b', ...]
    // Backend ត្រូវការ: index-based access answers[i]
    let { answers } = req.body;

    console.log('========== SUBMIT EXAM ==========');
    console.log('ExamId:', examId, '| StudentId:', studentId);
    console.log('Answers raw:', answers, '| Type:', typeof answers);

    // ✅ Normalize answers → Array ជានិច្ច
    if (!answers) {
      answers = [];
    } else if (!Array.isArray(answers)) {
      // ប្រសិនបើ object {0: 'a', 1: 'b'} → convert to array
      const maxIdx = Math.max(...Object.keys(answers).map(Number));
      answers = Array.from({ length: maxIdx + 1 }, (_, i) => answers[i] || '');
    }

    console.log('Answers normalized:', answers);

    const exam = await sequelize.query(
      `SELECT e.*, s.name as subjectName 
       FROM exams e 
       LEFT JOIN subjects s ON e.subjectId = s.id 
       WHERE e.id = :examId`,
      {
        replacements: { examId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!exam || exam.length === 0) {
      return res.status(404).json({ message: 'មិនឃើញការប្រឡង' });
    }

    const examData = exam[0];
    const isRandomMode = examData.numberOfQuestions && examData.numberOfQuestions > 0;

    // ✅ FIX: Check duplicate submit មុន insert
    const existingResult = await sequelize.query(
      `SELECT id FROM exam_results WHERE examId = :examId AND studentId = :studentId AND status = 'completed'`,
      {
        replacements: { examId, studentId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existingResult.length > 0) {
      return res.status(400).json({ message: 'អ្នកបានបញ្ជូនចម្លើយរួចហើយ' });
    }

    // Get questions for this student (always from student_exam_questions)
    let questions = await sequelize.query(
      `SELECT q.id, q.points, q.correctAnswer, seq.\`order\`
       FROM student_exam_questions seq 
       LEFT JOIN questions q ON seq.questionId = q.id 
       WHERE seq.examId = :examId AND seq.studentId = :studentId 
       ORDER BY seq.\`order\` ASC`,
      {
        replacements: { examId, studentId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    console.log('Questions from student_exam_questions:', questions.length);

    // ✅ Fallback: exam_questions (សម្រាប់ exam ចាស់មុន fix)
    if (questions.length === 0) {
      questions = await sequelize.query(
        `SELECT q.id, q.points, q.correctAnswer, eq.\`order\`
         FROM exam_questions eq 
         LEFT JOIN questions q ON eq.questionId = q.id 
         WHERE eq.examId = :examId 
         ORDER BY eq.\`order\` ASC`,
        {
          replacements: { examId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      console.log('Fallback - Questions from exam_questions:', questions.length);
    }

    if (questions.length === 0) {
      return res.status(404).json({ message: 'មិនឃើញសំណួរសម្រាប់ការប្រឡងនេះ' });
    }

    if (isRandomMode) {
      questions = questions.map(q => ({ ...q, points: 1 }));
    }

    // Calculate score
    let totalScore = 0;
    const studentAnswers = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      // ✅ FIX: Safe access — empty string ប្រសិនបើគ្មានចម្លើយ
      const userAnswer = (answers[i] || '').toString().toLowerCase().trim();
      const correctAnswer = (question.correctAnswer || '').toString().toLowerCase().trim();
      const isCorrect = userAnswer !== '' && userAnswer === correctAnswer;
      const pointsEarned = isCorrect ? (question.points || 1) : 0;
      totalScore += pointsEarned;

      studentAnswers.push({
        questionId: question.id,
        selectedOption: userAnswer,
        isCorrect,
        pointsEarned
      });
    }

    const actualTotalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const percentage = actualTotalPoints > 0 ? (totalScore / actualTotalPoints) * 100 : 0;

    console.log(`Score: ${totalScore}/${actualTotalPoints} = ${percentage.toFixed(2)}%`);

    // Save result
    const result = await sequelize.query(
      `INSERT INTO exam_results (examId, studentId, totalScore, percentage, submittedAt, status, createdAt, updatedAt) 
       VALUES (:examId, :studentId, :totalScore, :percentage, NOW(), 'completed', NOW(), NOW())`,
      {
        replacements: { examId, studentId, totalScore, percentage },
        type: sequelize.QueryTypes.INSERT
      }
    );

    const resultId = result[0];
    console.log('Result saved ID:', resultId);

    // Save answers
    for (const answer of studentAnswers) {
      await sequelize.query(
        `INSERT INTO student_answers (resultId, questionId, selectedOption, isCorrect, pointsEarned, createdAt, updatedAt) 
         VALUES (:resultId, :questionId, :selectedOption, :isCorrect, :pointsEarned, NOW(), NOW())`,
        {
          replacements: {
            resultId,
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            isCorrect: answer.isCorrect ? 1 : 0,
            pointsEarned: answer.pointsEarned
          },
          type: sequelize.QueryTypes.INSERT
        }
      );
    }

    console.log('Submit completed ✅');
    console.log('================================');

    res.json({
      resultId,
      totalScore,
      totalPoints: actualTotalPoints,
      percentage: parseFloat(percentage.toFixed(2)),
      answers: studentAnswers
    });
  } catch (error) {
    console.error('ERROR in submitExam:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'កំហុសប្រព័ន្ធ', error: error.message });
  }
};

// Get student results
const getMyResults = async (req, res) => {
  try {
    const studentId = req.user.id;
    const results = await sequelize.query(
      `SELECT er.*, e.title as examTitle, e.totalPoints, e.id as examId,
              s.name as subjectName 
       FROM exam_results er 
       LEFT JOIN exams e ON er.examId = e.id 
       LEFT JOIN subjects s ON e.subjectId = s.id 
       WHERE er.studentId = :studentId AND er.status = 'completed'
       ORDER BY er.submittedAt DESC`,
      {
        replacements: { studentId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    res.json(results);
  } catch (error) {
    console.error('Error in getMyResults:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAvailableExams, getExamDetails, submitExam, getMyResults };