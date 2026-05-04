const { sequelize } = require('../config/db');

// ✅ Helper: Parse DB date string as UTC
const parseUTC = (str) => {
  if (!str) return null;
  // ✅ ប្រសិនបើ Sequelize return Date Object រួចហើយ
  if (str instanceof Date) return str;
  // ✅ ប្រសិនបើជា String
  const s = str.toString().trim();
  return new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
};

// Get available exams for student
const getAvailableExams = async (req, res) => {
  try {
    const now = new Date();
    // ✅ Format now as UTC string for DB comparison
    const nowUTC = now.toISOString().slice(0, 19).replace('T', ' ');

    const exams = await sequelize.query(
      `SELECT e.*, s.name as subjectName 
       FROM exams e 
       LEFT JOIN subjects s ON e.subjectId = s.id 
       WHERE e.isActive = 1 
       AND e.endDate >= :now
       ORDER BY e.startDate ASC`,
      {
        replacements: { now: nowUTC },
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
    // ✅ Parse DB dates as UTC
    const startDate = parseUTC(examData.startDate);
    const endDate = parseUTC(examData.endDate);

    console.log('getExamDetails - time check:', {
      now: now.toISOString(),
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      notStarted: now < startDate,
      expired: now > endDate,
    });

    if (now < startDate) {
      return res.status(400).json({ message: 'ការប្រឡងមិនទាន់ចាប់ផ្តើម' });
    }
    if (now > endDate) {
      return res.status(400).json({ message: 'ការប្រឡងបានបញ្ចប់ហើយ' });
    }

    // Check if student already took this exam
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

    // Check if student already has assigned questions
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
              replacements: {
                examId,
                studentId,
                questionId: availableQuestions[i].id,
                order: i
              },
              type: sequelize.QueryTypes.INSERT
            }
          );
        }

        // Random mode: 1 point per question
        questions = availableQuestions.map(q => ({ ...q, points: 1 }));
      } else {
        // Manual mode: use points from database
        questions = await sequelize.query(
          `SELECT q.*, eq.order 
           FROM exam_questions eq 
           LEFT JOIN questions q ON eq.questionId = q.id 
           WHERE eq.examId = :examId 
           ORDER BY eq.order ASC`,
          {
            replacements: { examId },
            type: sequelize.QueryTypes.SELECT
          }
        );
      }
    } else {
      // Get previously assigned questions
      questions = await sequelize.query(
        `SELECT q.*, seq.order 
         FROM student_exam_questions seq 
         LEFT JOIN questions q ON seq.questionId = q.id 
         WHERE seq.examId = :examId AND seq.studentId = :studentId 
         ORDER BY seq.order ASC`,
        {
          replacements: { examId, studentId },
          type: sequelize.QueryTypes.SELECT
        }
      );

      // Random mode: override points to 1 per question
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
    const { answers } = req.body;
    const studentId = req.user.id;

    console.log('========== SUBMIT EXAM ==========');
    console.log('ExamId:', examId);
    console.log('StudentId:', studentId);
    console.log('Answers:', answers);

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
    console.log('Exam title:', examData.title);
    console.log('Random mode:', isRandomMode);

    // Get questions for this student
    let questions = await sequelize.query(
      `SELECT q.id, q.points, q.correctAnswer, seq.order 
       FROM student_exam_questions seq 
       LEFT JOIN questions q ON seq.questionId = q.id 
       WHERE seq.examId = :examId AND seq.studentId = :studentId 
       ORDER BY seq.order ASC`,
      {
        replacements: { examId, studentId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    console.log('Questions from student_exam_questions:', questions.length);

    if (questions.length === 0) {
      questions = await sequelize.query(
        `SELECT q.id, q.points, q.correctAnswer, eq.order 
         FROM exam_questions eq 
         LEFT JOIN questions q ON eq.questionId = q.id 
         WHERE eq.examId = :examId 
         ORDER BY eq.order ASC`,
        {
          replacements: { examId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      console.log('Questions from exam_questions:', questions.length);
    }

    if (questions.length === 0) {
      return res.status(404).json({ message: 'មិនឃើញសំណួរសម្រាប់ការប្រឡងនេះ' });
    }

    // Random mode: 1 point per question | Manual mode: use database points
    if (isRandomMode) {
      questions = questions.map(q => ({ ...q, points: 1 }));
    }

    // Calculate score
    let totalScore = 0;
    const studentAnswers = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = (answers && answers[i]) ? answers[i] : '';
      const isCorrect = userAnswer.toLowerCase() === (question.correctAnswer || '').toLowerCase();
      const pointsEarned = isCorrect ? (question.points || 0) : 0;
      totalScore += pointsEarned;

      studentAnswers.push({
        questionId: question.id,
        selectedOption: userAnswer,
        isCorrect,
        pointsEarned
      });
    }

    const actualTotalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    const percentage = actualTotalPoints > 0 ? (totalScore / actualTotalPoints) * 100 : 0;

    console.log('Total score:', totalScore);
    console.log('Total points:', actualTotalPoints);
    console.log('Percentage:', percentage);

    // Save result
    const result = await sequelize.query(
      `INSERT INTO exam_results (examId, studentId, totalScore, percentage, submittedAt, status) 
       VALUES (:examId, :studentId, :totalScore, :percentage, NOW(), 'completed')`,
      {
        replacements: { examId, studentId, totalScore, percentage },
        type: sequelize.QueryTypes.INSERT
      }
    );

    const resultId = result[0];
    console.log('Result saved with ID:', resultId);

    // Save answers
    for (const answer of studentAnswers) {
      await sequelize.query(
        `INSERT INTO student_answers (resultId, questionId, selectedOption, isCorrect, pointsEarned) 
         VALUES (:resultId, :questionId, :selectedOption, :isCorrect, :pointsEarned)`,
        {
          replacements: {
            resultId,
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            isCorrect: answer.isCorrect,
            pointsEarned: answer.pointsEarned
          },
          type: sequelize.QueryTypes.INSERT
        }
      );
    }

    console.log('Submit exam completed successfully');
    console.log('================================');

    res.json({
      resultId,
      totalScore,
      totalPoints: actualTotalPoints,
      percentage: parseFloat(percentage.toFixed(2)),
      answers: studentAnswers
    });
  } catch (error) {
    console.error('ERROR in submitExam:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'កំហុសប្រព័ន្ធ',
      error: error.message
    });
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