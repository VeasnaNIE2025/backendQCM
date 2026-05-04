const { sequelize } = require('../config/db');

// Get all exams for Admin
const getExams = async (req, res) => {
  try {
    const exams = await sequelize.query(
      `SELECT e.*, s.name as subjectName 
       FROM exams e 
       LEFT JOIN subjects s ON e.subjectId = s.id 
       ORDER BY e.createdAt DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json(exams);
  } catch (error) {
    console.error('Error in getExams:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get exam by ID with questions
const getExamById = async (req, res) => {
  try {
    const exam = await sequelize.query(
      `SELECT e.*, s.name as subjectName 
       FROM exams e 
       LEFT JOIN subjects s ON e.subjectId = s.id 
       WHERE e.id = ?`,
      { replacements: [req.params.id], type: sequelize.QueryTypes.SELECT }
    );

    if (!exam || exam.length === 0) {
      return res.status(404).json({ message: 'មិនឃើញការប្រឡង' });
    }

    const questions = await sequelize.query(
      `SELECT q.*, eq.order 
       FROM exam_questions eq 
       LEFT JOIN questions q ON eq.questionId = q.id 
       WHERE eq.examId = ? 
       ORDER BY eq.order ASC`,
      { replacements: [req.params.id], type: sequelize.QueryTypes.SELECT }
    );

    res.json({ ...exam[0], questions });
  } catch (error) {
    console.error('Error in getExamById:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create exam (with random mode support)
const createExam = async (req, res) => {
  try {
    const { title, subjectId, description, duration, startDate, endDate, questionIds, numberOfQuestions } = req.body;

    // Validation
    if (!title) return res.status(400).json({ message: 'ត្រូវការចំណងជើងប្រឡង' });
    if (!subjectId) return res.status(400).json({ message: 'ត្រូវការមុខវិជ្ជា' });
    if (!duration) return res.status(400).json({ message: 'ត្រូវការរយៈពេល' });
    if (!startDate) return res.status(400).json({ message: 'ត្រូវការថ្ងៃចាប់ផ្តើម' });
    if (!endDate) return res.status(400).json({ message: 'ត្រូវការថ្ងៃបញ្ចប់' });

    let totalPoints = 0;
    let totalQuestions = 0;
    let finalQuestionIds = [];

    if (numberOfQuestions && numberOfQuestions > 0) {
      // Random mode: randomly select questions from subject as the pool
      const availableQuestions = await sequelize.query(
        `SELECT id, points FROM questions WHERE subjectId = ? ORDER BY RAND() LIMIT ?`,
        { replacements: [subjectId, numberOfQuestions], type: sequelize.QueryTypes.SELECT }
      );

      finalQuestionIds = availableQuestions.map(q => q.id);
      totalQuestions = numberOfQuestions;
      totalPoints = numberOfQuestions;   // Random mode: 1 point per question
    } else if (questionIds && questionIds.length > 0) {
      // Manual mode: use selected questions
      finalQuestionIds = questionIds;
      totalQuestions = questionIds.length;

      const questions = await sequelize.query(
        `SELECT SUM(points) as totalPoints FROM questions WHERE id IN (?)`,
        { replacements: [questionIds], type: sequelize.QueryTypes.SELECT }
      );
      totalPoints = questions[0]?.totalPoints || 0;
    } else {
      return res.status(400).json({ message: 'ត្រូវការជ្រើសរើសសំណួរ ឬកំណត់ចំនួន Random' });
    }

    // Create exam
    const result = await sequelize.query(
      `INSERT INTO exams (title, subjectId, description, duration, totalPoints, totalQuestions, startDate, endDate, numberOfQuestions, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      {
        replacements: [title, subjectId, description || '', duration, totalPoints, totalQuestions, startDate, endDate, numberOfQuestions || null],
        type: sequelize.QueryTypes.INSERT
      }
    );

    const examId = result[0];

    // Save question pool to exam_questions table
    for (let i = 0; i < finalQuestionIds.length; i++) {
      await sequelize.query(
        `INSERT INTO exam_questions (examId, questionId, \`order\`) VALUES (?, ?, ?)`,
        { replacements: [examId, finalQuestionIds[i], i], type: sequelize.QueryTypes.INSERT }
      );
    }

    res.status(201).json({ id: examId, message: 'បង្កើតការប្រឡងបានជោគជ័យ' });
  } catch (error) {
    console.error('Error in createExam:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update exam
const updateExam = async (req, res) => {
  try {
    const examId = req.params.id;
    const { title, subjectId, description, duration, startDate, endDate, isActive, questionIds, numberOfQuestions } = req.body;

    const existingExam = await sequelize.query(
      `SELECT * FROM exams WHERE id = ?`,
      { replacements: [examId], type: sequelize.QueryTypes.SELECT }
    );

    if (!existingExam || existingExam.length === 0) {
      return res.status(404).json({ message: 'មិនឃើញការប្រឡង' });
    }

    // Build update query dynamically
    let updateQuery = `UPDATE exams SET `;
    const updateValues = [];

    if (title) { updateQuery += `title = ?, `; updateValues.push(title); }
    if (subjectId) { updateQuery += `subjectId = ?, `; updateValues.push(subjectId); }
    if (description !== undefined) { updateQuery += `description = ?, `; updateValues.push(description); }
    if (duration) { updateQuery += `duration = ?, `; updateValues.push(duration); }
    if (startDate) { updateQuery += `startDate = ?, `; updateValues.push(startDate); }
    if (endDate) { updateQuery += `endDate = ?, `; updateValues.push(endDate); }
    if (isActive !== undefined) { updateQuery += `isActive = ?, `; updateValues.push(isActive); }
    if (numberOfQuestions !== undefined) { updateQuery += `numberOfQuestions = ?, `; updateValues.push(numberOfQuestions); }

    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = ?`;
    updateValues.push(examId);

    await sequelize.query(updateQuery, { replacements: updateValues, type: sequelize.QueryTypes.UPDATE });

    // Update questions if needed
    if (numberOfQuestions && numberOfQuestions > 0) {
      // Random mode
      await sequelize.query(`DELETE FROM exam_questions WHERE examId = ?`, { replacements: [examId], type: sequelize.QueryTypes.DELETE });
      await sequelize.query(`DELETE FROM student_exam_questions WHERE examId = ?`, { replacements: [examId], type: sequelize.QueryTypes.DELETE });

      const currentExam = existingExam[0];
      const availableQuestions = await sequelize.query(
        `SELECT id FROM questions WHERE subjectId = ? ORDER BY RAND() LIMIT ?`,
        { replacements: [subjectId || currentExam.subjectId, numberOfQuestions], type: sequelize.QueryTypes.SELECT }
      );

      for (let i = 0; i < availableQuestions.length; i++) {
        await sequelize.query(
          `INSERT INTO exam_questions (examId, questionId, \`order\`) VALUES (?, ?, ?)`,
          { replacements: [examId, availableQuestions[i].id, i], type: sequelize.QueryTypes.INSERT }
        );
      }

      // Random mode: 1 point per question
      await sequelize.query(
        `UPDATE exams SET totalPoints = ?, totalQuestions = ? WHERE id = ?`,
        { replacements: [numberOfQuestions, numberOfQuestions, examId], type: sequelize.QueryTypes.UPDATE }
      );
    } else if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
      // Manual mode
      await sequelize.query(`DELETE FROM exam_questions WHERE examId = ?`, { replacements: [examId], type: sequelize.QueryTypes.DELETE });
      await sequelize.query(`DELETE FROM student_exam_questions WHERE examId = ?`, { replacements: [examId], type: sequelize.QueryTypes.DELETE });

      for (let i = 0; i < questionIds.length; i++) {
        await sequelize.query(
          `INSERT INTO exam_questions (examId, questionId, \`order\`) VALUES (?, ?, ?)`,
          { replacements: [examId, questionIds[i], i], type: sequelize.QueryTypes.INSERT }
        );
      }

      const questions = await sequelize.query(
        `SELECT SUM(points) as totalPoints, COUNT(*) as totalQuestions FROM questions WHERE id IN (?)`,
        { replacements: [questionIds], type: sequelize.QueryTypes.SELECT }
      );

      await sequelize.query(
        `UPDATE exams SET totalPoints = ?, totalQuestions = ? WHERE id = ?`,
        { replacements: [questions[0]?.totalPoints || 0, questions[0]?.totalQuestions || 0, examId], type: sequelize.QueryTypes.UPDATE }
      );
    }

    res.json({ message: 'កែប្រែការប្រឡងបានជោគជ័យ' });
  } catch (error) {
    console.error('Error in updateExam:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete exam
const deleteExam = async (req, res) => {
  try {
    const examId = req.params.id;

    await sequelize.query(`DELETE FROM student_exam_questions WHERE examId = ?`, { replacements: [examId], type: sequelize.QueryTypes.DELETE });
    await sequelize.query(`DELETE FROM exam_questions WHERE examId = ?`, { replacements: [examId], type: sequelize.QueryTypes.DELETE });
    await sequelize.query(`DELETE FROM exams WHERE id = ?`, { replacements: [examId], type: sequelize.QueryTypes.DELETE });

    res.json({ message: 'លុបការប្រឡងបានជោគជ័យ' });
  } catch (error) {
    console.error('Error in deleteExam:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExams, getExamById, createExam, updateExam, deleteExam };
